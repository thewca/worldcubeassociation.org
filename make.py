#!/usr/bin/python

import argparse
import os
import shutil
import subprocess
import sys

import webbrowser

# Script constants

translations = [
  "english",
  "german",
  "indonesian",
  "russian",
  "chinese",
  "hungarian"
]

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
  help="Check out the branch (of wca-documents) and build ino the appropriate subdirectory for the given language. Available languages: " + (", ".join(translations))
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

args = parser.parse_args()


# Arguments


if args.language not in (translations + [None]):
  sys.stderr.write("\nInvalid language: " + args.language + "\n\n")
  parser.print_help()
  exit(-1)


# Clean


if args.clean and os.path.exists(buildRootDir):
  shutil.rmtree(buildRootDir)


# Build!


def checkoutWCADocumentsBranch(branchName):
  subprocess.check_call([
    "git",
    "--git-dir=./wca-documents/.git",
    "--work-tree=./wca-documents",
    "checkout",
    branchName
  ])


def build(directory):

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
    subprocess.check_call(["cp", "pdf/build/wca-regulations-and-guidelines-2013.pdf", buildDir])


def buildBranch(branchName, directory):
  checkoutWCADocumentsBranch(branchName)
  build(directory)


def buildTranslation(lang):
  branchName = "translation-" + lang
  directory = "translations/" + lang + "/"
  # url = "http://www.worldcubeassociation.org/regulations/translations/" + lang + "/"

  if lang == "english":
    branchName = "official"
    directory = ""

  buildBranch(branchName, directory)


def buildEnglish():
  buildBranch("official", "")


if not args.do_not_build:
  if args.all:
    [buildTranslation(lang) for lang in translations]
    checkoutWCADocumentsBranch("official")

  elif args.language == None:
    build("")

  elif args.language in translations:
    buildTranslation(args.language)

  print "Finished building."


if args.archive:
  subprocess.check_call(["rm", "-rf", archiveFile])
  subprocess.check_call([
    "tar", "--exclude", ".DS_Store", "-zcf",
    archiveFile, buildRootDir
  ])


if args.server:

  localURL = "http://localhost:8081/build/"
  if args.language in translations:
    localURL = localURL + "translations/" + args.language + "/"
  webbrowser.open(localURL)

  print "Serving " + buildRootDir + " at " + localURL
  print "Press Ctrl-C to halt."

  # This seems to work better than trying to call it from Python.
  subprocess.call(["python", "-m",  "SimpleHTTPServer", "8081"])
