#!/bin/bash

import_db() {
    rm -rf /tmp/import_db
    mkdir -p /tmp/import_db
    cd /tmp/import_db

    # Download full database export from live site
    echo "Please enter your credentials for https://www.worldcubeassociation.org/results/admin/"
    read -p "Username: " username
    read -s -p "Password: " password
    wget --user=$username --password=$password https://www.worldcubeassociation.org/results/admin/dump/worldcubeassociation.org_alldbs.tar.gz

    # Extract full export into .sql files
    tar xf worldcubeassociation.org_alldbs.tar.gz

    for sql_file in *.sql; do
        table_name=`basename $sql_file .sql`
        echo "Importing $table_name table..."
        echo "CREATE DATABASE IF NOT EXISTS $table_name;" | mysql -h localhost -uroot -proot
        mysql -h localhost -uroot -proot $table_name < $sql_file
    done
}


time import_db

echo "Computing auxiliary data..."
time curl 'http://localhost/results/admin/compute_auxiliary_data.php?doit=+Do+it+now+'

echo "Done importing!"
