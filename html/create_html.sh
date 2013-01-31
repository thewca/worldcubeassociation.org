#!/bin/bash

set -e

VERSION="${1}"
function markdown_program {
  pandoc -s -t html $@
  # rdiscount < $@ # Doesnt' handle character encoding correctly.
  # markdown < $@ # Several issues.
}

function htmlify {
  FILE="${1}"
  TITLE="${2}"
  SOURCE="${3}"

  if [ -f "${FILE}" ]; then rm "${FILE}"; fi
  cat html_header_1.html >> "${FILE}"
  echo -n "${TITLE}" >> "${FILE}"
  cat html_header_2.html >> "${FILE}"
  markdown_program "${SOURCE}" >> "${FILE}"
  cat html_footer.html >> "${FILE}"
}

htmlify "index.html"        "WCA Regulations 2013"    "../wca-documents/wca-regulations-2013.md"
htmlify "guidelines.html"   "WCA Guidelines 2013"     "../wca-documents/wca-guidelines-2013.md"
htmlify "history.html"      "WCA Regulations History" "history.md"
htmlify "translations.html" "WCA Translations"        "translations.md"
htmlify "scrambles.html"    "WCA Scrambles"           "scrambles.md"

pushd "../wca-documents" > /dev/null
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
GIT_VERSION=$(git rev-parse --short HEAD)
popd > /dev/null

./create_html.py \
  --regulations-file "index.html" \
  --guidelines-file "guidelines.html" \
  --git-branch "${GIT_BRANCH}" \
  --git-hash "${GIT_VERSION}"