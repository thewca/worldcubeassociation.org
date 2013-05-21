# WCA Documents - Extra Files

This repository contains files related to the maintenance of the [wca-documents](https://github.com/cubing/wca-documents) repository that are not directly part of the documents.

## Build the WCA documents

    git clone https://github.com/cubing/wca-documents-extra.git
    cd wca-documents-extra
    git submodule update --init
    ./make.py

Run the following to view the resulting files in your browser:

    ./make.py -ds

## Dependencies

- `Python`
- [`pandoc`](http://johnmacfarlane.net/pandoc/installing.html) (for converting the documents from Markdown to HTML/LaTeX)
- `pdflatex` (for converting LaTeX to PDF)

## Release Process

For all official `wca-documents` updates:

- Board approval
    - Email the for Board the proposal for changes.
    - Get explicit Board approval.
- Git
    - Create a wca-documents commit with all the changes, and the new date.
    - Update wca-documents/official to point to it.
    - Push to GitHub.
- Web
  - Build wca-documents-extra using `./make -w`
  - Upload to the WCA server.
- Announce
  - [WCA forum](http://www.worldcubeassociation.org/forum/viewforum.php?f=9) - one thread per year
  - [WCA Homepage](http://worldcubeassociation.org/) Drupal
  - Email `wca-delegates` list.
