#!/usr/bin/env python2

import argparse
import functools
import json
import multiprocessing
import os
import shutil
import subprocess
import sys
import webbrowser

# cd to the directory that this script is in, so it can be run
# from other directories.
entryPoint = os.path.split(os.path.abspath(__file__))[0]
os.chdir(entryPoint)

import html
import pdf

# Script constants

languages_file = "config/languages.json"
buildRootDir = "./build/regulations/"

defaultLanguage = "english"

# Main


def main():

  args = parser.parse_args()

  if args.wca:
    args.clean = True
    args.all = True
    args.pdf = True

  if args.all:
    args.data = True

  # Override previous PDF settings at the end
  if args.no_pdf:
    args.pdf = False

  if args.clean:
    clean(args)

  if not args.do_not_build:
    build(args)

  if args.server:
    server(args)


# Language Data Setup

languageData = {}
with open(languages_file, "r") as fileHandle:
  languageData = json.load(fileHandle)

languages = languageData.keys()

max_lang_width = len(max(languages, key=len))

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
  default=defaultLanguage,
  help="Language to build.",
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
  help="Build all languages and data (this includes --data)."
)

parser.add_argument(
  '--data',
  action='store_true',
  default=False,
  help="Build data."
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


try:
  num_cores_available = multiprocessing.cpu_count()
except:
  num_cores_available = 1

parser.add_argument(
  '--num-workers', '-#',
  type=int,
  default=num_cores_available,
  help="Number of workers. Defaults to the number of cores available."
)

parser.add_argument(
  '--verbose', '-v',
  action='store_true',
  default=False,
  help="Print lots of debug/progress info."
)


# Clean

def clean(args):
  print "Cleaning build folder: %s" % buildRootDir
  if os.path.exists(buildRootDir):
    shutil.rmtree(buildRootDir)


# Build!

# We want the pool to be accessible to the workers, so that they can cut off in case of a keyboard interrupt.
# However, this is impossible to do by passing around/currying the pool, so we're making it a "global" variable.
pool = {}


def build(args):
  if args.all:

    # Build languages
    print "Using %d workers." % args.num_workers
    f = functools.partial(buildLanguagePooled, args)
    if args.num_workers == 1:
      # multiprocessing destroys our backtraces, so don't use it for 1 worker. This makes
      # it possible to debug.
      map(f, languages)
    else:
      pool = multiprocessing.Pool(processes=args.num_workers)
      pool.map(f, languages)

  else:
    buildLanguage(args, args.language)

  if args.data:
    subprocess.check_call([ "git", "checkout", "origin/regulations-data", "build" ])
    # The call to git checkout placed files in our staging area. Discard them here.
    subprocess.check_call([ "git", "reset", "HEAD", "build" ])

  print "Finished building."


def buildLanguage(args, language):

  if language == defaultLanguage:
    buildDirectory = ""
    isTranslation = False
  else:
    buildDirectory = "translations/" + language + "/"
    isTranslation = True

  buildDir = buildRootDir + buildDirectory
  if not os.path.exists(buildDir):
    os.makedirs(buildDir)

  pdfName = languageData[language]["pdf"]

  srcDir = "translations/" + language if isTranslation else "wca-regulations"

  print "%s Generating HTML in %s" % (("[" + language + "]").ljust(max_lang_width + 2), buildDir)
  html.html(language, srcDir, buildDir, pdfName + ".pdf", isTranslation=isTranslation, verbose=args.verbose)

  if args.pdf:
    pdf.pdf(
      language,
      buildDir,
      isTranslation,
      pdfName,
      languageData[language]["tex_encoding"],
      languageData[language]["tex_command"],
      verbose=args.verbose
    )


def buildLanguagePooled(args, language):
  try:
    buildLanguage(args, language)
  except KeyboardInterrupt:
      pool.terminate()
      pool.wait()


# Non-Build Actions

def server(args):

  localURL = "http://localhost:8081/regulations/"
  if not args.language == defaultLanguage:
    localURL = localURL + "translations/" + args.language + "/"
  webbrowser.open(localURL)

  print "Serving " + buildRootDir + " at " + localURL
  print "Press Ctrl-C to halt."

  # This seems to work better than trying to call it from Python.
  subprocess.call(["python", "-m", "SimpleHTTPServer", "8081"], cwd="./build/")


# Make the script work standalone.


if __name__ == "__main__":
    main()
