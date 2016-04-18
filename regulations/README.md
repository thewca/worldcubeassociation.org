# WCA Documents - Extra Files

This repository contains files related to the maintenance of the [wca-documents](https://github.com/cubing/wca-documents) repository that are not directly part of the documents.

## Build the WCA documents

    git clone https://github.com/cubing/wca-documents-extra.git
    cd wca-documents-extra
    git submodule update --init ./wca-documents

    ./make.py

To view the result in your browser (OSX):

    ./make.py -ds

To build everything, including all translations, run:

    git submodule update --init # Run this once to set up the translations.

    ./make.py --wca

## Dependencies

If you want to build the Regulations without creating the pdf :

- `Python`
- [`pandoc`](http://johnmacfarlane.net/pandoc/installing.html) (for converting the documents from Markdown to HTML/LaTeX)
- `git` (to switch among translation sources automatically)

If you want to create the pdf version of the Regulations :

- `pdflatex` (for converting LaTeX to PDF)
- `xelatex` (for converting LaTeX to PDF)

### Fonts

You will also need some fonts for specific translations (e.g. Chinese, Japanese, and Korean):

- [UnBatang](http://kldp.net/projects/unfonts/download)
    - Direct download: [`UnBatang_0613.ttf`](http://kldp.net/projects/unfonts/download/4706?filename=UnBatang_0613.ttf)
- [AR PL UMing CN](http://www.freedesktop.org/wiki/Software/CJKUnifonts/Download/)
    - Direct download: [`ttf-arphic-uming_0.2.20080216.1.orig.tar.gz`](http://archive.ubuntu.com/ubuntu/pool/main/t/ttf-arphic-uming/ttf-arphic-uming_0.2.20080216.1.orig.tar.gz) (only `uming.ttc` is needed)

Their installation depends on your operating system, but you can have a look at the file `.travis.yml` of this repository to see the minimal requirements to build on a Debian-like system.

## Documentation

See:

- [Regulations Style Guide](./style-guide.md)
- [Regulations Release Process](./doc/regulations-release.md)
- [Scramble Program Release Process](./doc/scramble-program-release.md)
- [New WRC Member Process](./doc/wrc-member-addition.md)
- [WRC Member Qualifications](./doc/wrc-member-qualifications.md)