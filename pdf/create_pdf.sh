#!/bin/bash

TEX_FILE="wca-regs.tex"

rm "${TEX_FILE}"
cat tex_header.tex > "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-regulations-2012.md >> "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-guidelines-2012.md >> "${TEX_FILE}"
cat tex_footer.tex >> "${TEX_FILE}"

pdflatex "${TEX_FILE}"