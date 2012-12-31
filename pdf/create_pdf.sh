#!/bin/bash

TEX_FILE="wca-regulations.tex"

rm "${TEX_FILE}"
cat tex_header.tex >> "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-regulations-2013.md >> "${TEX_FILE}"
cat tex_middle.tex >> "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-guidelines-2013.md >> "${TEX_FILE}"
cat tex_footer.tex >> "${TEX_FILE}"

pdflatex "${TEX_FILE}"