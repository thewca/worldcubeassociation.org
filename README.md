# WCA Documents - Extra Files

This repository contains files related to the maintenance of the [wca-documents](https://github.com/cubing/wca-documents) repository that are not directly part of the documents.

## Build the WCA documents

    git clone https://github.com/cubing/wca-documents-extra.git
    cd wca-documents-extra
    git submodule update --init
    ./make.py

Run the following to view the resulting files in your browser:

    ./make.py -ds

In order to set up all the branches in the `wca-documents` folder to track the translation repos, run:

    ./make.py -d --setup-wca-documents

## Dependencies

If you want to build the Regulations without creating the pdf :

- `Python`
- [`pandoc`](http://johnmacfarlane.net/pandoc/installing.html) (for converting the documents from Markdown to HTML/LaTeX)
- `git` (to switch among translation sources automatically)

If you want to create the pdf version of the Regulations :

- `pdflatex` (for converting LaTeX to PDF)
- `xelatex` (for converting LaTeX to PDF)

You will also need some fonts for specific translations such as Chinese, Japanese, and Korean :

- `UnBatang` ([source](http://kldp.net/projects/unfonts/download))
- `AR PL UMing CN` ([source](http://www.freedesktop.org/wiki/Software/CJKUnifonts/Download/))

Their installation depends on your Operating System, but you can have a look at the file `.travis.yml` of this repository to see the minimal requirements to build on a debian-like system.
In case you have trouble finding them, there is a copy of these fonts in the directory `pdf/fonts`.

## Regulations Release Process

For all official `wca-documents` updates:

- Announcement
    - Create a (proposed) announcement in `announcements`. This will be used/updated several times.
    - Include a summarized list of changes.
    - Follow previous formatting.
- Board approval
    - Email the for Board the proposal for changes (announcement + diff).
    - Get explicit Board approval.
- Git
    - Create a `wca-documents` commit with all the changes, and the new date.
    - Update `wca-documents/official` to point to it.
    - Tag the official release commit with `official-YYYY-MM-DD`.
    - Push to [GitHub](https://github.com/cubing/wca-documents).
- Web
    - Build wca-documents-extra using `./make -w`
    - Upload to the WCA server.
- Post Announcement
    - Release only Monday/Tuesday if possible, Wednesday is okay. See [the first WRC announcement](https://www.worldcubeassociation.org/regulations/announcements/introducing-wrc-announcements). (Does not apply to the yearly change, which should go into effect Jan. 1.)
    - Make sure links are up to date, and the date the changes go into effect is listed.
    - [WCA Homepage](https://worldcubeassociation.org/) Drupal
    - [WCA forum](https://www.worldcubeassociation.org/forum/viewforum.php?f=9) - one thread per year
    - Email `wca-delegates` list.


## Scramble Program Release Process

- Follow appropriate parts of the process from the `wca-documents` update.
- Release only on Monday, except for extremely critical updates.
- On the scramble page, update:
  - All mentions of the current scramble program version.
  - List the latest update.
  - Update the list of old versions.
- Update the API with the new version.


## Known Issues

- "--" is displayed as a large hyphen in LaTeX. A work-around has been to filter input file in the `build_pdf.sh` script.
