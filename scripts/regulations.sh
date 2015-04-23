#!/usr/bin/env bash

set -e

install_deps() {
  # Dependencies for wca-documents-extra. Some of this came from
  # https://github.com/cubing/wca-documents-extra/blob/master/.travis.yml, but has
  # been tweaked for Ubuntu 14.04
  sudo apt-get install -y git
  sudo apt-get install -y texlive-fonts-recommended
  sudo apt-get install --no-install-recommends -y pandoc fonts-unfonts-core fonts-arphic-uming
  sudo apt-get install --no-install-recommends -y texlive-lang-all texlive-xetex texlive-latex-recommended texlive-latex-extra lmodern
}

rebuild() {
  # Build WCA regulations
  wca-documents-extra/make.py --setup-wca-documents --wca
  if [ -a webroot/regulations ]; then
    rm -rf webroot/regulations-todelete
    mv webroot/regulations webroot/regulations-todelete;
  fi
  mv wca-documents-extra/build/regulations webroot/
  rm -rf webroot/regulations-todelete
}

cd "$(dirname "$0")"/..
source scripts/_parse_args.sh
