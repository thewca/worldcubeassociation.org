#!/usr/bin/python

import argparse
import json
import os
import shutil
import subprocess
import webbrowser

# Script constants

languages_file = "languages.json"

with open(languages_file, "r") as fileHandle:
  languages = json.load(fileHandle)

buildRootDir = "build/"
archiveFile = "build.tgz"

# Script Parameters


parser = argparse.ArgumentParser(
  description='Build the WCA Regulations site.',
  formatter_class=argparse.ArgumentDefaultsHelpFormatter
)

parser.add_argument(
  '--clean', '-c',
  action='store_true',
  default=False,
  help="Remove build directory first."
)

parser.add_argument(
  '--language', '-l',
  default=None,
  help="Check out the branch (of wca-documents) and " +
    "build into the appropriate subdirectory for the given language.",
  choices=languages
)

parser.add_argument(
  '--do-not-build', '-d',
  action='store_true',
  default=False,
  help="Don't build. Useful for server and archive options."
)

parser.add_argument(
  '--all', '-a',
  action='store_true',
  default=False,
  help="Build all languages."
)

parser.add_argument(
  '--fragment', '-f',
  action='store_true',
  default=False,
  help="Generate html fragment files, rather than standalone."
)

parser.add_argument(
  '--no-pdf',
  action='store_true',
  default=False,
  help="Do not generate PDF."
)

parser.add_argument(
  '--archive', '-z',
  action='store_true',
  default=False,
  help="Produce a compressed archive of the build folder."
)

parser.add_argument(
  '--server', '-s',
  action='store_true',
  default=False,
  help="Run a local test server and open build directory."
)

# Main


def main():

  args = parser.parse_args()

  if args.clean:
    clean(args)

  if not args.do_not_build:
    build(args)

  if args.archive:
    archive(args)

  if args.server:
    server(args)


# Clean

def clean(args):
  if os.path.exists(buildRootDir):
    shutil.rmtree(buildRootDir)


# Build!


def build(args):
  if args.all:
    [buildTranslation(args, lang) for lang in languages]
    checkoutWCADocumentsBranch(args, "official")

  elif args.language == None:
    buildToDirectory(args, "")

  elif args.language in languages:
    buildTranslation(args, args.language)

  print "Finished building."


def checkoutWCADocumentsBranch(args, branchName):
  subprocess.check_call([
    "git",
    "--git-dir=./wca-documents/.git",
    "--work-tree=./wca-documents",
    "checkout",
    branchName
  ])


def buildToDirectory(args, directory):

  buildDir = buildRootDir + directory
  if not os.path.exists(buildDir):
    os.makedirs(buildDir)

  subprocess.check_call([
    "html/build_html.sh",
    ("1" if args.fragment else "0")
  ])
  subprocess.check_call(["cp", "-r", "html/build/", buildDir])

  if not args.no_pdf:
    subprocess.check_call(["pdf/build_pdf.sh"])
    subprocess.check_call([
      "cp",
      "pdf/build/wca-regulations-and-guidelines-2013.pdf",
      buildDir
    ])


def buildBranch(args, branchName, directory):
  checkoutWCADocumentsBranch(args, branchName)
  buildToDirectory(args, directory)


def buildTranslation(args, lang):
  branchName = "translation-" + lang
  directory = "translations/" + lang + "/"

  if lang == "english":
    branchName = "official"
    directory = ""

  buildBranch(args, branchName, directory)


# Non-Build Actions


def archive(args):
  subprocess.check_call(["rm", "-rf", archiveFile])
  subprocess.check_call([
    "tar", "--exclude", ".DS_Store", "-zcf",
    archiveFile, buildRootDir
  ])


def server(args):

  localURL = "http://localhost:8081/build/"
  if args.language in languages:
    localURL = localURL + "translations/" + args.language + "/"
  webbrowser.open(localURL)

  print "Serving " + buildRootDir + " at " + localURL
  print "Press Ctrl-C to halt."

  # This seems to work better than trying to call it from Python.
  subprocess.call(["python", "-m",  "SimpleHTTPServer", "8081"])


# Make the script work standalone.


if __name__ == "__main__":
    main()
