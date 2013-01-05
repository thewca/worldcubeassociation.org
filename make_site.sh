#!/bin/bash

set -e

mkdir -p build

cd html
./create_html.sh
cd ..
cp html/*.html build/
cp "html/style.css" build/
cp html/*.svg build/
rm build/html_*

# cd pdf
# ./create_pdf.sh
# cd ..
# cp pdf/wca-regulations-and-guidelines-2013.pdf build/
echo "WARNING: NOT GENERATING PDF"

cd build
open "http://localhost:${1:-8080}/" && python -m SimpleHTTPServer ${1:-8080}