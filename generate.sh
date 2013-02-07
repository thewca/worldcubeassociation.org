#!/bin/bash

set -e

LANGUAGE="${1}"
HTML_FRAGMENT="0"

if [ "$#" -gt "1" ]
then
  HTML_FRAGMENT="${2}"
fi

if [ "${LANGUAGE}" = "" ]
then
  echo "Usage: ${0} [language] [fragment]"
  echo ""
  echo "language: all, english, or a translation branch"
  echo "fragment: 0 (default) for standalone, 1 for HTML fragments only."
  exit -1
fi

if [ "${LANGUAGE}" = "all" ]
then

  rm -rf ./upload

  "$0" english "${HTML_FRAGMENT}"

  "$0" german "${HTML_FRAGMENT}"
  "$0" indonesian "${HTML_FRAGMENT}"
  "$0" russian "${HTML_FRAGMENT}"
  "$0" chinese "${HTML_FRAGMENT}"
  "$0" hungarian "${HTML_FRAGMENT}"

  rm -rf upload.tgz
  tar --exclude=".DS_Store" -zcf upload.tgz upload/

  cd wca-documents
  git checkout master
else

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
  # git pull
  # git push origin "${BRANCH}"
  cd ..

  ./build_site.sh "${HTML_FRAGMENT}"

  mkdir -p "upload/"
  mkdir -p "upload/${DIR}"
  cp -r build/ "upload/${DIR}"
fi