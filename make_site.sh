#!/bin/bash

mkdir -p build

cd html
./create_html.sh
cd ..
cp html/*.html build/
cp "html/style.css" build/
cp html/*.svg build/
rm build/html_*

cd pdf
./create_pdf.sh
cd ..
cp pdf/wca-regulations-and-guidelines-2013.pdf build/