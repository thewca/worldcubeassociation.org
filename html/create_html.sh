#!/bin/bash

set -e

BUILD_DIR="build"

VERSION="${1}"
function markdown_program {
  pandoc -s -t html $@
  # rdiscount < $@ # Doesnt' handle character encoding correctly.
  # markdown < $@ # Several issues.
}

function htmlify {
  FILE="${BUILD_DIR}/${1}"
  TITLE="${2}"
  SOURCE="${3}"

  if [ -f "${FILE}" ]; then rm "${FILE}"; fi
  cat "templates/html_header_1.html" >> "${FILE}"
  echo -n "${TITLE}" >> "${FILE}"
  cat "templates/html_header_2.html" >> "${FILE}"
  markdown_program "${SOURCE}" >> "${FILE}"
  cat "templates/html_footer.html" >> "${FILE}"
}

cp files/* build/

htmlify "index.html"        "WCA Regulations 2013"    "../wca-documents/wca-regulations-2013.md"
htmlify "guidelines.html"   "WCA Guidelines 2013"     "../wca-documents/wca-guidelines-2013.md"
htmlify "history.html"      "WCA Regulations History" "src/history.md"
htmlify "translations.html" "WCA Translations"        "src/translations.md"
htmlify "scrambles.html"    "WCA Scrambles"           "src/scrambles.md"

pushd "../wca-documents" > /dev/null
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
GIT_VERSION=$(git rev-parse --short HEAD)
popd > /dev/null

./create_html.py \
  --regulations-file "${BUILD_DIR}/index.html" \
  --guidelines-file "${BUILD_DIR}/guidelines.html" \
  --git-branch "${GIT_BRANCH}" \
  --git-hash "${GIT_VERSION}"