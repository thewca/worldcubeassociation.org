#!/bin/bash

HTML_FRAGMENT="${1}"
LANGUAGE="${2}"

if [ "${LANGUAGE}" = "" ]
then
  echo "No language specified."
  exit -1
fi

BRANCH="translation-${LANGUAGE}"
DIR="translations/${LANGUAGE}/"
URL="http://www.worldcubeassociation.org/regulations/translations/${LANGUAGE}/"

if [ "${LANGUAGE}" = "english" ]
then
  BRANCH="official"
  DIR=""
  URL="http://www.worldcubeassociation.org/regulations/"
fi

cd wca-documents
git checkout "${BRANCH}"
git pull
git push origin "${BRANCH}"
cd ..

./build_site.sh "${HTML_FRAGMENT}"

mkdir -p "upload/"
mkdir -p "upload/${DIR}"
cp -r build/ "upload/${DIR}"