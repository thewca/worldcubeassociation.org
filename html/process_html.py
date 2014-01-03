#!/usr/bin/python

import argparse, re, sys, traceback


# Script parameters

regsURL = "./"
guidesURL = "guidelines.html"

includeTitleLogo = True

## Sanity checks
numRegsArticles = 19
numGuidesArticles = 18

# Arguments

parser = argparse.ArgumentParser(description='Post-process the WCA Regulations and Guidelines in HTML form. This script makes significant assumptions about the formatting of the HTML.')
parser.add_argument('--regulations-file', default="index.html", help="Regulations file (modified in-place).")
parser.add_argument('--guidelines-file', default="guidelines.html", help="Regulations file (modified in-place).")
parser.add_argument('--git-branch', default="", help="git branch of the Regulations and Guidelines we're building.")
parser.add_argument('--git-hash', default="", help="git hash of the Regulations and Guidelines we're building.")
parser.add_argument('--fragment', default="0", help="Is html fragment, rather than standalone.")

parser.add_argument('--regs-url', default=regsURL, help="url for regulations content")
parser.add_argument('--guides-url', default=guidesURL, help="url for guidelines content")


args = parser.parse_args()

gitHash = args.git_hash
gitBranch = args.git_branch
print "Git branch: ", gitHash
print "Git hash: ", gitBranch

regsFileName = args.regulations_file
guidesFileName = args.guidelines_file
regsURL = args.regs_url
guidesURL = args.guides_url

isFragment = args.fragment

# Read and close files

regsFile = open(regsFileName, "r")
regsText = regsFile.read()
regsFile.close();

guidesFile = open(guidesFileName, "r")
guidesText = guidesFile.read()
guidesFile.close();


# Match/Replace constants

regOrGuide2Slots = r'([A-Za-z0-9]+)' + r'(\+*)'
ANY = -1

# Replacement functions

def replaceRegs(expected, rgxMatch, rgxReplace):
    global regsText
    (regsText, num) = re.subn(rgxMatch, rgxReplace, regsText)
    if (expected != ANY and num != expected):
        print >> sys.stderr, "Expected", expected, "replacements for Regulations, there were", num
        print >> sys.stderr, "Matching: ", rgxMatch
        print >> sys.stderr, "Replacing: ", rgxReplace
        traceback.print_stack()
        exit(-1)
    print "Regulations: [" + str(num) + "]", rgxMatch, "\nRegulations:  ->", rgxReplace
    return num

def replaceGuides(expected, rgxMatch, rgxReplace):
    global guidesText
    (guidesText, num) = re.subn(rgxMatch, rgxReplace, guidesText)
    if (expected != ANY and num != expected):
        print >> sys.stderr, "Expected", expected, "replacements for Guidelines, there were", num
        print >> sys.stderr, "Matching: ", rgxMatch
        print >> sys.stderr, "Replacing: ", rgxReplace
        traceback.print_stack()
        exit(-1)
    print "Guidelines:  [" + str(num) + "]", rgxMatch, "\nGuidelines:   ->", rgxReplace
    return num

def replaceBothWithDifferent(expectedReg, expectedGuide, rgxMatch, rgxReplaceRegs, rgxReplaceGuides):
    numRegs = replaceRegs(expectedReg, rgxMatch, rgxReplaceRegs)
    numGuides = replaceGuides(expectedGuide, rgxMatch, rgxReplaceGuides)
    return (numRegs, numGuides)

def replaceBothWithSame(expectedReg, expectedGuide, rgxMatch, rgxReplace):
    return replaceBothWithDifferent(expectedReg, expectedGuide, rgxMatch, rgxReplace, rgxReplace)

def hyperLinkReplace(expectedReg, expectedGuide, linkMatch, linkReplace, textReplace):
    res = replaceBothWithSame(expectedReg, expectedGuide,
        r'<a href="' + linkMatch + r'">([^<]*)</a>',
        r'<a href="' + linkReplace + r'">' + textReplace + r'</a>'
    )
    return res


# Article Lists

# \1: Article "number" (or letter) [example: B]
# \2: new anchor name part [example: blindfolded]
# \3: old anchor name [example: blindfoldedsolving]
# \4: Article name, may be translated [example: Article B]
# \5: Title [example: Blindfolded Solving]
articleMatch = r'<h2[^>]*><article-([^>]*)><([^>]*)><([^>]*)> ([^\:]*)\: ([^<]*)</h2>';

allRegsArticles = re.findall(articleMatch, regsText)
allGuidesArticles = re.findall(articleMatch, guidesText)

def makeTOC(articles):
    return "<ul id=\"table_of_contents\">\n" + "".join([
        "<li>" + name + ": <a href=\"#article-" + num + "-" + new + "\">" + title + "</a></li>\n" 
        for (num, new, old, name, title)
        in articles
    ]) + "</ul>\n"

## Table of Contents
regsTOC = makeTOC(allRegsArticles)
replaceRegs(1, r'<table-of-contents>', regsTOC)

guidesTOC = makeTOC(allGuidesArticles)
replaceGuides(1, r'<table-of-contents>', guidesTOC)

## Article Numbering. We want to
  # Support old links with the old meh anchor names.
  # Support linking using just the number/letter (useful if you have to generate a link from a reference automatically, but don't have the name of the article).
  # Encourage a new format with the article number *and* better anchor names.
replaceBothWithSame(numRegsArticles, numGuidesArticles,
    articleMatch,
    r'<span id="\1"></span><span id="\3"></span><h2 id="article-\1-\2"> <a href="#article-\1-\2">\4</a>: \5</h2>'
)


# Numbering

regOrGuideLiMatch = r'<li>' + regOrGuide2Slots + r'\)'
regOrGuideLiReplace = r'<li id="\1\2"><a href="#\1\2">\1\2</a>)'

matchLabel1Slot = r'\[([^\]]+)\]'

## Numbering/links in the Regulations
replaceRegs(ANY,
    regOrGuideLiMatch,
    regOrGuideLiReplace
)
## Numbering/links in the Guidelines for ones that don't correspond to a Regulation.
replaceGuides(ANY,
    regOrGuideLiMatch + r' \[SEPARATE\]' + matchLabel1Slot,
    regOrGuideLiReplace + r' <span class="SEPARATE \3 label">\3</span>'
)
## Numbering/links in the Guidelines for ones that *do* correspond to a Regulation.
replaceGuides(ANY,
    regOrGuideLiMatch + r' ' + matchLabel1Slot,
    regOrGuideLiReplace  +  r' <span class="\3 label linked"><a href="' + regsURL + r'#\1">\3</a></span>'
)
## Explanation labels
replaceGuides(ANY,
    r'<label>' + matchLabel1Slot,
    r'<span class="example \1 label">\1</span>'
)


# Hyperlinks

hyperLinkReplace(ANY, ANY, r'regulations:article:' + regOrGuide2Slots, regsURL + r'#\1\2', r'\3')
hyperLinkReplace(  0, ANY, r'guidelines:article:' + regOrGuide2Slots, guidesURL + r'#\1\2', r'\3')

hyperLinkReplace(ANY, ANY, r'regulations:regulation:' + regOrGuide2Slots, regsURL + r'#\1\2', r'\3')
hyperLinkReplace(  0, ANY, r'guidelines:guideline:' + regOrGuide2Slots, guidesURL + r'#\1\2', r'\3')

hyperLinkReplace(ANY, ANY, r'regulations:top', regsURL, r'\1')
hyperLinkReplace(ANY, ANY, r'guidelines:top', guidesURL, r'\1')

hyperLinkReplace(1, 0, r'regulations:contents', regsURL + r'#contents', r'\1')
hyperLinkReplace(0, 1, r'guidelines:contents', guidesURL + r'#contents', r'\1')


# Title
if isFragment == "0":
    wcaTitleLogoSource = r'World Cube Association<br>'
    if includeTitleLogo:
        wcaTitleLogoSource = r'<center><img src="WCA_logo_with_text.svg" alt="World Cube Association" class="logo_with_text"></center>\n'

    replaceRegs(1, 
        r'<h1[^>]*><wca-title>([^<]*)</h1>',
        r'<h1>' + wcaTitleLogoSource + r'\1</h1>'
    )

    replaceGuides(1, 
        r'<h1[^>]*><wca-title>([^<]*)</h1>',
        r'<h1>' + wcaTitleLogoSource + r'\1</h1>'
    )


# Version
gitLink =r''
if (gitHash != ""):
    gitLink = r'[<code><a href="' + r'https://github.com/cubing/wca-documents/tree/' + gitBranch + '">' +gitBranch + r'</a>:' +r'<a href="https://github.com/cubing/wca-documents/commits/' + gitBranch + r'">' +gitHash + r'</a></code>]';

replaceBothWithSame(1, 1, 
    r'<p><version>([^<]*)</p>',
    r'<div class="version">\1<br>' + gitLink + r'</div>'
)


# Write files back out.

regsFile = open(regsFileName, "w")
regsFile.write(regsText)
regsFile.close()

guidesFile = open(guidesFileName, "w")
guidesFile.write(guidesText)
guidesFile.close()
