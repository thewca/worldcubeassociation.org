#!/bin/bash

TEX_FILE="wca-regulations-and-guidelines-2013.tex"

if [ -f "${TEX_FILE}" ]; then rm "${TEX_FILE}"; fi
cat tex_header.tex >> "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-regulations-2013.md >> "${TEX_FILE}"
cat tex_middle.tex >> "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-guidelines-2013.md >> "${TEX_FILE}"
cat tex_footer.tex >> "${TEX_FILE}"

pdflatex -interaction=batchmode "${TEX_FILE}"