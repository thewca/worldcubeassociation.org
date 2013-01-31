#!/bin/bash

GENERATE_PDF="1"

set -e

mkdir -p build

cd html
./create_html.sh
cd ..
cp html/*.html build/
cp "html/style.css" build/
cp html/*.svg build/
rm build/html_*

if [ "${GENERATE_PDF}" == "1" ]
then
  cd pdf
  ./create_pdf.sh
  cd ..
  cp "pdf/build/wca-regulations-and-guidelines-2013.pdf" build/
else
  echo "" && echo ""
  echo "WARNING: NOT GENERATING PDF"
  echo "" && echo ""
fi

cd build
open "http://localhost:${1:-8080}/" && python -m SimpleHTTPServer ${1:-8080}