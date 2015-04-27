#!/bin/bash

cd "$(dirname "$0")"/../webroot/results/admin/dump

print_usage_and_exit() {
  echo "Usage : $0 args_for_mysqldump"
  echo "For example : $0 --user=USER --password=PASS --host=HOST"
  exit
}
if [ $# -eq 0 ]; then
  print_usage_and_exit
fi

echo "Backing up cubing_cms..."
time mysqldump "$@" cubing_cms > cubing_cms.sql

echo "Backing up cubing_results..."
time mysqldump "$@" cubing_results > cubing_results.sql

echo "Backing up cubing_phpbb..."
time mysqldump "$@" cubing_phpbb > cubing_phpbb.sql

TAR_FILENAME=worldcubeassociation.org_alldbs.tar.gz
echo "Producing $TAR_FILENAME..."
time tar -zcvf "$TAR_FILENAME" *.sql
