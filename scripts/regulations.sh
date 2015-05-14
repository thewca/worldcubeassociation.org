#!/usr/bin/env bash

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
allowed_commands="rebuild"
source scripts/_parse_args.sh
