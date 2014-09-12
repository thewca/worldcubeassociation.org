import os
import shutil
import subprocess

import re
import sys
import traceback


MAX_LANG_WIDTH = 20


def md2html(filename):

  return subprocess.check_output([
    "pandoc",
    "--from", "markdown",
    "--to", "html",
    "--ascii",  # UTF-8 causes trouble, so we encode straight to HTML-escaped unicode.
    filename
  ])


class html():

  with open("files/html/templates/header1.html", "r") as f:
    header1 = f.read()
  with open("files/html/templates/header2.html", "r") as f:
    header2 = f.read()
  with open("files/html/templates/footer.html", "r") as f:
    footer = f.read()

  header2_subdirs = header2.replace("assets/", "../assets/")
  header2_translations = header2

  footer_subdirs = footer.replace("assets/", "../assets/")

  def __init__(self, language, buildDir, pdfName, gitBranch, translation=False, verbose=False):

    print "%s Generating HTML in %s" % (("[" + language + "]").ljust(MAX_LANG_WIDTH + 2), buildDir)

    self.language = language
    self.docs_folder = "translations/" + language if translation else "wca-documents"
    self.build_folder = buildDir
    self.translation = translation
    self.pdf_name = pdfName
    self.verbose = verbose

    regulations_text = md2html(self.docs_folder + "/wca-regulations.md")
    guidelines_text = md2html(self.docs_folder + "/wca-guidelines.md")

    version = subprocess.check_output([
      "git", "rev-parse", "--short", "HEAD"
    ], cwd=self.docs_folder).strip()

    regulations_text, guidelines_text = self.process_html({
      "git_hash": version,
      "git_branch": gitBranch,
      "regs_text": regulations_text,
      "guides_text": guidelines_text,
      "regs_url": "./",
      "guides_url": "guidelines.html"
    })

    header = self.header2_translations if translation else self.header2

    with open(self.build_folder + "/index.html", "w") as f:
      f.write(self.header1 + "WCA Regulations" + header + regulations_text + self.footer)
    with open(self.build_folder + "/guidelines.html", "w") as f:
      f.write(self.header1 + "WCA Guidelines" + header + guidelines_text + self.footer)

    # shutil.copy("files/html/style.css", self.build_folder + "/style.css")
    # shutil.copy("files/html/WCA_logo_with_text.svg", self.build_folder + "/WCA_logo_with_text.svg")

    if not os.path.exists(self.build_folder + "/assets"):
      os.mkdir(self.build_folder + "/assets")
    shutil.copy("files/html/assets/style.css", self.build_folder + "/assets/style.css")
    shutil.copy("files/html/assets/bootstrap.min.css", self.build_folder + "/assets/bootstrap.min.css")
    shutil.copy("files/html/assets/jquery.minified.js", self.build_folder + "/assets/jquery.minified.js")
    shutil.copy("files/html/assets/bootstrap.min.js", self.build_folder + "/assets/bootstrap.min.js")
    shutil.copy("files/html/assets/navbar-static-top.css", self.build_folder + "/assets/navbar-static-top.css")
    shutil.copy("files/html/assets/wca_logo.svg", self.build_folder + "/assets/wca_logo.svg")

    if not translation:
      self.pages()

  def write_page(self, title, path, filename, header2, footer, text):

    if not os.path.isdir(path):
      os.makedirs(path)

    with open(path + "/" + filename, "w") as f:
      f.write(self.header1 + title + header2 + text + footer)

  def pages(self):

    self.write_page("WCA Regulations History", self.build_folder + "/history", "index.html", self.header2_subdirs, self.footer_subdirs, md2html("pages/history.md"))
    self.write_page("WCA Scrambles", self.build_folder + "/scrambles", "index.html", self.header2_subdirs, self.footer_subdirs, md2html("pages/scrambles.md"))
    self.write_page("WCA Translations", self.build_folder + "/translations", "index.html", self.header2_subdirs, self.footer_subdirs, md2html("pages/translations.md"))
    self.write_page("WCA Regulations/Guidelines Process", self.build_folder, "process.html", self.header2, self.footer, md2html("pages/process.md"))

  #
  #
  #
  #
  #
  #
  #
  #
  #
  #
  #
  #
  # TODO: Replace the code below with clean code (BeautifulSoup?).
  #
  #

  ANY = -1

  # Replacement functions

  def replaceRegs(self, expected, rgxMatch, rgxReplace):

      (self.regsText, num) = re.subn(rgxMatch, rgxReplace, self.regsText)
      if (expected != self.ANY and num not in expected):
          print >> sys.stderr, "Expected", expected, "replacements for Regulations, there were", num
          print >> sys.stderr, "Matching: ", rgxMatch
          print >> sys.stderr, "Replacing: ", rgxReplace
          traceback.print_stack()
          exit(-1)
      if self.verbose:
        print "Regulations: [" + str(num) + "]", rgxMatch, "\nRegulations:  ->", rgxReplace
      return num

  def replaceGuides(self, expected, rgxMatch, rgxReplace):

      (self.guidesText, num) = re.subn(rgxMatch, rgxReplace, self.guidesText)
      if (expected != self.ANY and num not in expected):
          print >> sys.stderr, "Expected", expected, "replacements for Guidelines, there were", num
          print >> sys.stderr, "Matching: ", rgxMatch
          print >> sys.stderr, "Replacing: ", rgxReplace
          traceback.print_stack()
          exit(-1)
      if self.verbose:
        print "Guidelines:  [" + str(num) + "]", rgxMatch, "\nGuidelines:   ->", rgxReplace
      return num

  def replaceBothWithDifferent(self, expectedReg, expectedGuide, rgxMatch, rgxReplaceRegs, rgxReplaceGuides):
      numRegs = self.replaceRegs(expectedReg, rgxMatch, rgxReplaceRegs)
      numGuides = self.replaceGuides(expectedGuide, rgxMatch, rgxReplaceGuides)
      return (numRegs, numGuides)

  def replaceBothWithSame(self, expectedReg, expectedGuide, rgxMatch, rgxReplace):
      return self.replaceBothWithDifferent(expectedReg, expectedGuide, rgxMatch, rgxReplace, rgxReplace)

  def hyperLinkReplace(self, expectedReg, expectedGuide, linkMatch, linkReplace, textReplace):
      res = self.replaceBothWithSame(expectedReg, expectedGuide,
                                     r'<a href="' + linkMatch + r'">([^<]*)</a>',
                                     r'<a href="' + linkReplace + r'">' + textReplace + r'</a>'
                                     )
      return res

  def process_html(self, args):

    # Script parameters

    regsURL = "./"
    guidesURL = "guidelines.html"

    includeTitleLogo = False

    ## Sanity checks
    numRegsArticles = [19]
    numGuidesArticles = [17, 18]

    # Arguments

    gitHash = args["git_hash"]
    gitBranch = args["git_branch"]

    self.regsText = args["regs_text"]
    self.guidesText = args["guides_text"]
    regsURL = args["regs_url"]
    guidesURL = args["guides_url"]

    # Match/Replace constants

    regOrGuide2Slots = r'([A-Za-z0-9]+)' + r'(\+*)'

    # Article Lists

    # \1: Article "number" (or letter) [example: B]
    # \2: new anchor name part [example: blindfolded]
    # \3: old anchor name [example: blindfoldedsolving]
    # \4: Article name, may be translated [example: Article B]
    # \5: Title [example: Blindfolded Solving]
    articleMatch = r'<h2[^>]*><article-([^>]*)><([^>]*)><([^>]*)> ([^\:]*)\: ([^<]*)</h2>'

    allRegsArticles = re.findall(articleMatch, self.regsText)
    allGuidesArticles = re.findall(articleMatch, self.guidesText)

    def makeTOC(articles):
        return "<ul id=\"table_of_contents\">\n" + "".join([
            "<li>" + name + ": <a href=\"#article-" + num + "-" + new + "\">" + title + "</a></li>\n"
            for (num, new, old, name, title)
            in articles
        ]) + "</ul>\n"

    ## Table of Contents
    regsTOC = makeTOC(allRegsArticles)
    self.replaceRegs([1], r'<table-of-contents>', regsTOC)

    guidesTOC = makeTOC(allGuidesArticles)
    self.replaceGuides([1], r'<table-of-contents>', guidesTOC)

    ## Article Numbering. We want to
      # Support old links with the old meh anchor names.
      # Support linking using just the number/letter (useful if you have to generate a link from a reference automatically, but don't have the name of the article).
      # Encourage a new format with the article number *and* better anchor names.
    self.replaceBothWithSame(numRegsArticles, numGuidesArticles,
                             articleMatch,
                             r'<span id="\1"></span><span id="\3"></span><h2 id="article-\1-\2"> <a href="#article-\1-\2">\4</a>: \5</h2>'
                             )

    # Numbering

    regOrGuideLiMatch = r'<li>' + regOrGuide2Slots + r'\)'
    regOrGuideLiReplace = r'<li id="\1\2"><a href="#\1\2">\1\2</a>)'

    matchLabel1Slot = r'\[([^\]]+)\]'

    ## Numbering/links in the Regulations
    self.replaceRegs(self.ANY,
                     regOrGuideLiMatch,
                     regOrGuideLiReplace
                     )
    ## Numbering/links in the Guidelines for ones that don't correspond to a Regulation.
    self.replaceGuides(self.ANY,
                       regOrGuideLiMatch + r' \[SEPARATE\]' + matchLabel1Slot,
                       regOrGuideLiReplace + r' <span class="SEPARATE \3 label">\3</span>'
                       )
    ## Numbering/links in the Guidelines for ones that *do* correspond to a Regulation.
    self.replaceGuides(self.ANY,
                       regOrGuideLiMatch + r' ' + matchLabel1Slot,
                       regOrGuideLiReplace + r' <span class="\3 label linked"><a href="' + regsURL + r'#\1">\3</a></span>'
                       )
    ## Explanation labels
    self.replaceGuides(self.ANY,
                       r'<label>' + matchLabel1Slot,
                       r'<span class="example \1 label">\1</span>'
                       )

    # PDF

    self.hyperLinkReplace([0, 1], [0], r'link:pdf', self.pdf_name, r'\1')  # TODO: Remove 0 once this is on the wca-documents official branch.

    # Hyperlinks

    self.hyperLinkReplace(self.ANY, self.ANY, r'regulations:article:' + regOrGuide2Slots, regsURL + r'#\1\2', r'\3')
    self.hyperLinkReplace([0], self.ANY, r'guidelines:article:' + regOrGuide2Slots, guidesURL + r'#\1\2', r'\3')

    self.hyperLinkReplace(self.ANY, self.ANY, r'regulations:regulation:' + regOrGuide2Slots, regsURL + r'#\1\2', r'\3')
    self.hyperLinkReplace([0], self.ANY, r'guidelines:guideline:' + regOrGuide2Slots, guidesURL + r'#\1\2', r'\3')

    self.hyperLinkReplace(self.ANY, self.ANY, r'regulations:top', regsURL, r'\1')
    self.hyperLinkReplace(self.ANY, self.ANY, r'guidelines:top', guidesURL, r'\1')

    self.hyperLinkReplace([1], [0], r'regulations:contents', regsURL + r'#contents', r'\1')
    self.hyperLinkReplace([0], [1], r'guidelines:contents', guidesURL + r'#contents', r'\1')

    # Title
    wcaTitleLogoSource = r'World Cube Association<br>'
    if includeTitleLogo:
        wcaTitleLogoSource = r'<center><img src="WCA_logo_with_text.svg" alt="World Cube Association" class="logo_with_text"></center>\n'
    wcaTitleLogoSource = "" # Included in the header now.

    self.replaceRegs([1],
                     r'<h1[^>]*><wca-title>([^<]*)</h1>',
                     r'<h1>' + wcaTitleLogoSource + r'\1</h1>'
                     )

    self.replaceGuides([1],
                       r'<h1[^>]*><wca-title>([^<]*)</h1>',
                       r'<h1>' + wcaTitleLogoSource + r'\1</h1>'
                       )

    # Version
    gitLink = r''
    if (gitHash != ""):
        repo = "https://github.com/cubing/wca-documents-translations" if self.translation else "https://github.com/cubing/wca-documents"
        gitLink = '[<code><a href="%s/tree/%s">%s</a>:<a href="%s/commits/%s">%s</a></code>]' % (repo, gitBranch, gitBranch, repo, gitBranch, gitHash)

    self.replaceBothWithSame([1], [1],
                             r'<p><version>([^<]*)</p>',
                             r'<div class="version">\1<br>' + gitLink + r'</div>'
                             )

    # Write files back out.

    return self.regsText, self.guidesText
