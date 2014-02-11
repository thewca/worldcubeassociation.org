#!/usr/bin/python

import argparse
import functools
import json
import multiprocessing
import os
import shutil
import subprocess
import sys
import webbrowser

import html
import pdf

# Script constants

languages_file = "config/languages.json"
upload_server_file = "config/upload_server.json"
buildRootDir = "build/"

defaultLang = "default"

git_command = [
  "git",
  "--git-dir=./wca-documents/.git",
  "--work-tree=./wca-documents"
]

# Main


def main():

  args = parser.parse_args()

  if args.release:
    args.wca = True
    args.upload = True

  if args.wca:
    args.clean = True
    args.all = True
    args.pdf = True

  # Override previous PDF settings at the end
  if args.no_pdf:
    args.pdf = False

  startingBranch = currentBranch()

  try:

    if args.setup_wca_documents:
      setup_wca_documents(args)

    if args.clean:
      clean(args)

    if not args.do_not_build:
      build(args)

    if args.upload:
      upload(args)

    if args.server:
      server(args)

  finally:

    if args.reset_to_master:
      checkoutWCADocs("master")
    else:
      checkoutWCADocs(startingBranch)


# Language Data Setup

languageData = {}
with open(languages_file, "r") as fileHandle:
  languageData = json.load(fileHandle)

languages = languageData.keys()
languages.remove(defaultLang)


# Configuration

try:
  with open(upload_server_file, "r") as fileHandle:
    upload_server = json.load(fileHandle)
except IOError:
    upload_server = {}  # Might not be needed.

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
  help="Don't build. Useful for server option."
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
  help="Generate html fragment files, rather than standalone. " +
    "Note that translations may look like gibberish in a browser, " +
    "because they don't have a tag to specify UTF8 encoding."
)

parser.add_argument(
  '--pdf', '-p',
  action='store_true',
  default=False,
  help="Generate PDF."
)

parser.add_argument(
  '--no-pdf',
  action='store_true',
  default=False,
  help="Do not generate PDF. Useful for -w when PDF generation has issues."
)

parser.add_argument(
  '--reset-to-master', '-m',
  action='store_true',
  default=False,
  help="Reset wca-documents by checking out master at the end. " +
    "Useful with -d in order to reset wca-documents-extra for commits."
)

parser.add_argument(
  '--upload', '-u',
  action='store_true',
  default=False,
  help="Upload to an SFTP server on completion, using rsync."
)

parser.add_argument(
  '--server', '-s',
  action='store_true',
  default=False,
  help="Run a local test server and open build directory."
)

parser.add_argument(
  '--wca', '-w',
  action='store_true',
  default=False,
  help="Full WCA release build. Equivalent to -cap."
)

parser.add_argument(
  '--release', '-r',
  action='store_true',
  default=False,
  help="Equivalent to -wu"
)

parser.add_argument(
  '--setup-wca-documents',
  action='store_true',
  default=False,
  help="Set up remotes for wca-documents."
)

try:
  num_cores_available = multiprocessing.cpu_count()
except:
  num_cores_available = 1

parser.add_argument(
  '--num-workers',
  type=int,
  default=num_cores_available,
  help="Number of workers. Defaults to the number of cores available."
)

parser.add_argument(
  '--verbose',
  action='store_true',
  default=False,
  help="Print lots of debug/progress info."
)


# Clean

def clean(args):
  print "Cleaning build folder: %s" % buildRootDir
  if os.path.exists(buildRootDir):
    shutil.rmtree(buildRootDir)


# Git Operations

def currentBranch():
  output = subprocess.check_output(git_command + [
    "rev-parse",
    "--abbrev-ref",
    "HEAD"
  ])

  return output.strip()


def checkoutWCADocs(branchName):
  if branchName == "official":
    subprocess.check_call(git_command + [
      "checkout",
      branchName
    ])


# Build!

# We want the pool to be accessible to the workers, so that they can cut off in cast of a keyboard interrupt.
# However, this is impossible to do by passing around/currying the pool, so we're making it a "global" variable.
pool = {}


def build(args):
  if args.all:

    print "Using %d workers." % args.num_workers
    pool = multiprocessing.Pool(processes=args.num_workers)
    f = functools.partial(buildTranslationPooled, args)
    pool.map(f, languages)

    checkoutWCADocs("official")

  elif not args.language:
    buildToDirectory(args, "dev")

  elif args.language in languages:
    buildTranslation(args, args.language)

  print "Finished building."


def buildToDirectory(args, directory, lang=defaultLang, translation=False):

  buildDir = buildRootDir + directory
  if not os.path.exists(buildDir):
    os.makedirs(buildDir)

  html.html(lang, translation=translation, verbose=args.verbose)

  pdfName = languageData[lang]["pdf"]

  if args.pdf:
    pdf.pdf(
      lang,
      translation,
      pdfName,
      languageData[lang]["tex_encoding"],
      languageData[lang]["tex_command"],
      verbose=args.verbose
    )


def buildBranch(args, branchName, directory, lang=defaultLang, translation=False):
  checkoutWCADocs(branchName)
  buildToDirectory(args, directory, lang, translation)


def buildTranslation(args, lang):
    branchName = languageData[lang]["branch"]
    directory = "translations/" + lang + "/"
    translation = True

    if lang == "english":
      branchName = "official"
      directory = ""
      translation = False

    buildBranch(args, branchName, directory, lang=lang, translation=translation)


def buildTranslationPooled(args, lang):
  try:
    buildTranslation(args, lang)
  except KeyboardInterrupt:
      pool.terminate()
      pool.wait()


# Non-Build Actions


def upload(args):

  if not os.path.exists(upload_server_file):
    sys.stderr.write("Config file for server uploads does not exist.\n")
    sys.stderr.write("Please create one at " + upload_server_file + " using the template.\n")
    return

  subprocess.check_call([
    "rsync",
    "-rl",  # recursive, copy symlinks
    "-vz",  # verbose, compressed transfer
    "-p",  # copy/set permissions
    "--chmod=ug=rwx",  # permissions to use (group-writable)
    "--exclude=.DS_Store",
    buildRootDir,
    upload_server["sftp_path"]
  ])
  print "Done uploading to SFTP server."
  print "Visit " + upload_server["base_url"]


def server(args):

  localURL = "http://localhost:8081/build/"
  if args.language in languages:
    localURL = localURL + "translations/" + args.language + "/"
  webbrowser.open(localURL)

  print "Serving " + buildRootDir + " at " + localURL
  print "Press Ctrl-C to halt."

  # This seems to work better than trying to call it from Python.
  subprocess.call(["python", "-m", "SimpleHTTPServer", "8081"])


def setup_wca_documents(args):
  for lang in languages:
    l = languageData[lang]
    if l["remote_name"] != "":
      subprocess.call(git_command + [
        "remote",
        "add",
        "--no-tags",
        "-t",
        l["remote_branch"],
        "-f",
        l["remote_name"],
        l["remote_url"]
      ])
      subprocess.call(git_command + [
        "branch",
        "--track",
        l["branch"],
        l["remote_name"] + "/" + l["remote_branch"]
      ])
    else:
      subprocess.call(git_command + [
        "branch",
        "--track",
        l["branch"],
        "origin" + "/" + l["branch"]
      ])

# Make the script work standalone.


if __name__ == "__main__":
    main()
