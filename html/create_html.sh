#!/bin/bash

function htmlify {
  FILE="${1}"
  TITLE="${2}"
  SOURCE="${3}"

  rm "${FILE}"
  cat html_header_1.html >> "${FILE}"
  echo "${TITLE}" >> "${FILE}"
  cat html_header_2.html >> "${FILE}"
  rdiscount "${SOURCE}" >> "${FILE}" # Markdown doesn't handle the nested lists properly.
  cat html_footer.html >> "${FILE}"
}

htmlify "index.html"        "WCA Regulations 2013"    "../wca-documents/wca-regulations-2013.md"
htmlify "guidelines.html"   "WCA Guidelines 2013"     "../wca-documents/wca-guidelines-2013.md"
htmlify "history.html"      "WCa Regulations History" "history.md"
htmlify "translations.html" "WCA Translations"        "translations.md"
htmlify "scrambles.html"    "WCA Scrambles"           "scrambles.md"

./create_html.py