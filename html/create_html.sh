#!/bin/bash

function htmlify {
  FILE="${1}"
  SOURCE="${2}"

  rm "${FILE}"
  cat html_header.html >> "${FILE}"
  markdown "${SOURCE}" >> "${FILE}"
  cat html_footer.html >> "${FILE}"
}

htmlify "index.html"        "../wca-documents/wca-regulations-2013.md"
htmlify "guidelines.html"   "../wca-documents/wca-guidelines-2013.md"
htmlify "history.html"      "history.md"
htmlify "translations.html" "translations.md"
htmlify "scrambles.html"    "scrambles.md"

./create_html.py