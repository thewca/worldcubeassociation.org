#!/bin/bash

mkdir -p site

cd html
./create_html.sh
cd ..
cp html/*.html site/
cp "html/style.css" site/
cp "html/wca_logo.svg" site/

cd pdf
./create_pdf.sh
cd ..
cp pdf/wca-regulations-and-guidelines-2013.pdf site/