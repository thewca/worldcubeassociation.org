#!/bin/bash

GENERATE_PDF="1"
HTML_FRAGMENT="0"

if [ "$#" -gt "0" ]
then
  HTML_FRAGMENT="${1}"
fi

set -e

rm -rf build
mkdir -p build

cd html
./build_html.sh "${HTML_FRAGMENT}"
cd ..
cp html/build/* build/

if [ "${GENERATE_PDF}" == "1" ]
then
  cd pdf
  ./build_pdf.sh
  cd ..
  cp "pdf/build/wca-regulations-and-guidelines-2013.pdf" build/
else
  echo "" && echo ""
  echo "WARNING: NOT GENERATING PDF"
  echo "" && echo ""
fi

cd build
# if [ "$(uname)" = "Darwin" ]; then open "http://localhost:${1:-8080}/"; fi
# python -m SimpleHTTPServer ${1:-8080}