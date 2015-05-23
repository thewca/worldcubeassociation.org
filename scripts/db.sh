#!/usr/bin/env bash

print_usage_and_exit() {
  echo "Usage: $0 [dump|import|drop_and_import] filename [args_for_mysql]"
  echo "For example: $0 import mysql-dump-2015-03-15.sql --user=USER --password=PASS --host=HOST"
  exit
}
if [ $# -eq 0 ]; then
  print_usage_and_exit
fi

COMMAND=$1
shift
if [ "$COMMAND" != "dump" ] && [ "$COMMAND" != "import" ] && [ "$COMMAND" != "drop_and_import" ]; then
  echo "Unrecognized command: $COMMAND."
  print_usage_and_exit
  exit 1
fi

TAR_FILENAME=$1
shift
# Check if $TAR_FILENAME ends in .tar.gz. Trick from
#  https://viewsby.wordpress.com/2013/09/06/bash-string-ends-with/
if [[ "$TAR_FILENAME" != *.tar.gz ]]; then
  echo "Invalid filename: $TAR_FILENAME Must end in .tar.gz"
  exit 1
fi

db_names="cubing_cms cubing_results cubing_phpbb"
db_filenames=""
sudo rm -rf /tmp/wca_db
mkdir -p /tmp/wca_db
if [ "$COMMAND" == "dump" ]; then
  for db_name in $db_names; do
    echo "Backing up $db_name"
    time mysqldump "$@" $db_name -r /tmp/wca_db/$db_name.sql
    db_filenames="$db_filenames $db_name.sql"
  done

  echo "Producing $TAR_FILENAME..."
  time tar -C /tmp/wca_db -zcvf "$TAR_FILENAME" $db_filenames
elif [ "$COMMAND" == "import" ] || [ "$COMMAND" == "drop_and_import" ]; then
  for db_name in $db_names; do
    if [ "$(mysql -N -s "$@" -e "SHOW DATABASES LIKE '$db_name';")" != "" ]; then
      if [ "$COMMAND" == "drop_and_import" ]; then
        echo "Dropping existing database: $db_name."
        mysql "$@" -e "DROP DATABASE $db_name;"
      else
        echo "Found an existing database: $db_name."
        echo "If you really want to reimport this database, rerun with drop_and_import."
        exit 0 # don't error out, we're called by chef!
      fi
    fi
  done

  # Extract full export into .sql files and import them.
  tar xf $TAR_FILENAME -C /tmp/wca_db
  for sql_file in /tmp/wca_db/*.sql; do
    table_name=`basename $sql_file .sql`
    echo "Importing $table_name table..."
    mysql "$@" -e "CREATE DATABASE IF NOT EXISTS $table_name DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;"
    mysql "$@" $table_name -e "SOURCE $sql_file"
  done
fi
