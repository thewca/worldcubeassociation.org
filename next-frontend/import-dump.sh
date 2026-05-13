#!/bin/bash

apt update && apt install -y unzip wget
wget https://assets.worldcubeassociation.org/export/payload/dump.zip
unzip dump.zip -d .
cd dump
for directory in *; do
    if [ -d "${directory}" ] ; then
        for metadata_file in $directory/*.metadata.json; do
            echo $metadata_file
            result=$(jq 'del(.options.storageEngine)' $metadata_file)
            echo $result > $metadata_file
        done
    fi
done
cd ..
mongorestore --drop --username=root --password=root
