#!/usr/bin/env bash

print_usage_and_exit() {
  echo "Usage: $0 [dump|import|drop_and_import] folder [args_for_mysql]"
  echo "For example: $0 import ~/mysql-dump-2015-03-15/ --user=USER --password=PASS --host=HOST"
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
fi

FOLDER=$1
shift

db_names="cubing cubing_phpbb"
if [ "$COMMAND" == "dump" ]; then
  sudo rm -rf $FOLDER
  mkdir -p $FOLDER
  for db_name in $db_names; do
    echo "Backing up database $db_name to $FOLDER/$db_name.sql"
    time mysqldump "$@" $db_name -r $FOLDER/$db_name.sql
  done
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

  # Import .sql files in $FOLDER
  for sql_file in $FOLDER/*.sql; do
    db_name=`basename $sql_file .sql`
    echo "Importing $db_name database..."
    mysql "$@" -e "CREATE DATABASE IF NOT EXISTS $db_name DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;"
    mysql "$@" $db_name -e "SOURCE $sql_file"
  done
fi
