#!/bin/bash

HTML_FILE_REGS="index.html"
HTML_FILE_GUIDES="guidelines.html"

rm "${HTML_FILE_REGS}"
cat html_header.html >> "${HTML_FILE_REGS}"
markdown ../wca-documents/wca-regulations-2013.md >> "${HTML_FILE_REGS}"
cat html_footer.html >> "${HTML_FILE_REGS}"

rm "${HTML_FILE_GUIDES}"
cat html_header.html >> "${HTML_FILE_GUIDES}"
markdown ../wca-documents/wca-guidelines-2013.md >> "${HTML_FILE_GUIDES}"
cat html_footer.html >> "${HTML_FILE_GUIDES}"

./create_html.py