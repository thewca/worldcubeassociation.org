#!/bin/bash

cd $(dirname "${0}")

BUILD_DIR="build"
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

TEX_FILE="${BUILD_DIR}/wca-regulations-and-guidelines-2013.tex"

if [ -f "${TEX_FILE}" ]; then rm "${TEX_FILE}"; fi
cat "templates/tex_header.tex" >> "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-regulations-2013.md >> "${TEX_FILE}"
cat "templates/tex_middle.tex" >> "${TEX_FILE}"
pandoc -t latex ../wca-documents/wca-guidelines-2013.md >> "${TEX_FILE}"
cat "templates/tex_footer.tex" >> "${TEX_FILE}"

pdflatex -output-directory="${BUILD_DIR}" "${TEX_FILE}"