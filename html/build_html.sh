#!/bin/bash

set -e

BUILD_DIR="build"

VERSION="${1}"
function markdown_program {
  pandoc -s -t html $@
  # rdiscount < $@ # Doesnt' handle character encoding correctly.
  # markdown < $@ # Several issues.
}
function markdown_fragment {
  pandoc -t html $@
}

# builds standalone html files
function htmlify {
  FILE="${BUILD_DIR}/${1}"
  TITLE="${2}"
  SOURCE="${3}"

  rm -f "${FILE}"
  cat "templates/html_header_1.html" >> "${FILE}"
  echo -n "${TITLE}" >> "${FILE}"
  cat "templates/html_header_2.html" >> "${FILE}"
  markdown_program "${SOURCE}" >> "${FILE}"
  cat "templates/html_footer.html" >> "${FILE}"
}

# build only html content
function htmlafragment {
  FILE="${BUILD_DIR}/${1}"
  SOURCE="${2}"
  rm -f "${FILE}"
  touch "${FILE}"
  markdown_fragment "${SOURCE}" >> "${FILE}"
}

cp files/* build/

# build standalone
htmlify "index.html"        "WCA Regulations 2013"    "../wca-documents/wca-regulations-2013.md"
htmlify "guidelines.html"   "WCA Guidelines 2013"     "../wca-documents/wca-guidelines-2013.md"
htmlify "history.html"      "WCA Regulations History" "src/history.md"
htmlify "translations.html" "WCA Translations"        "src/translations.md"
htmlify "scrambles.html"    "WCA Scrambles"           "src/scrambles.md"

# build content only - for embedding in WCA drupal install
mkdir -p "${BUILD_DIR}/content_files"
htmlafragment "content_files/index.content.html"        "../wca-documents/wca-regulations-2013.md"
htmlafragment "content_files/guidelines.content.html"   "../wca-documents/wca-guidelines-2013.md"
htmlafragment "content_files/history.content.html"      "src/history.md"
htmlafragment "content_files/translations.content.html" "src/translations.md"
htmlafragment "content_files/scrambles.content.html"    "src/scrambles.md"

pushd "../wca-documents" > /dev/null
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
GIT_VERSION=$(git rev-parse --short HEAD)
popd > /dev/null

# process standalone
./process_html.py \
  --regulations-file "${BUILD_DIR}/index.html" \
  --guidelines-file "${BUILD_DIR}/guidelines.html" \
  --git-branch "${GIT_BRANCH}" \
  --git-hash "${GIT_VERSION}" \
  --fragment 0

# process content only - URLs here need to be specific to the WCA's Drupal install.
./process_html.py \
  --regulations-file "${BUILD_DIR}/content_files/index.content.html" \
  --guidelines-file "${BUILD_DIR}/content_files/guidelines.content.html" \
  --git-branch "${GIT_BRANCH}" \
  --git-hash "${GIT_VERSION}" \
  --fragment 1 \
  --regs-url "/regulations/main" \
  --guides-url "/regulations/guidelines"
