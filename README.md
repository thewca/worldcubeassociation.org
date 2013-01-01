# WCA Documents - Extra Files

This repository contains files related to the maintenance of the [wca-documents](https://github.com/cubing/wca-documents) repository that are not directly part of the documents.

## Build the WCA documents

    git clone git@github.com:cubing/wca-documents-extra.git
    cd wca-documents-extra
    git submodule update --init
    ./make_site.sh

## Dependencies

- `Python`
- `rdiscount` (`Markdown.pl` doesn't handle nested lists properly.)
- `pdflatex`
- `pandoc`