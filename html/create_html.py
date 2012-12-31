#!/usr/bin/python

import re

regsFileName = "index.html"
guidesFileName = "guidelines.html"

fRegs = open(regsFileName, "r")
regsText = fRegs.read()
fRegs.close();

fGuides = open(guidesFileName, "r")
guidesText = fGuides.read()
fGuides.close();

# Numbering/links in the Regulations
regsText   = re.sub(r'<li>([A-Za-z0-9]+)\)',
                    r'<li id="\1"><a href="#\1" class="local_link">\1</a>)', regsText)
# Numbering/links in the Guidelines for ones that don't correspond to a Regulation.
guidesText = re.sub(r'<li>([A-Za-z0-9]+)(\+*)\) \[SEPARATE\]\[([^\]]+)\]',
                    r'<li id="\1\2"><a href="#\1\2" class="local_link">\1\2</a>) <span class="SEPARATE \3 label">\3</span>', guidesText)
# Numbering/links in the Guidelines for ones that *do* correspond to a Regulation.
guidesText = re.sub(r'<li>([A-Za-z0-9]+)(\+*)\) \[([^\]]+)\]',
                    r'<li id="\1\2"><a href="#\1\2" class="local_link">\1\2</a>) <span class="\3 label linked"><a href="./#\1">\3</a></span>', guidesText)
# Explanation labels
guidesText = re.sub(r'<label>\[([^\]]+)\]',
                    r'<span class="example \1 label">\1</span>', guidesText)


allRegsArticles = re.findall(r'<h2><([^>]*)><([^>]*)> Article ([A-Za-z0-9]+): ([^<]*)</h2>', regsText)
regsTOC = "<ul id=\"table_of_contents\">\n" + "".join(["<li>Article " + num + ": <a href=\"#article-" + num + "-" + new + "\">" + title + "</a></li>\n" for (new, old, num, title) in allRegsArticles]) + "</ul>\n"
regsText   = re.sub(r'<table-of-contents>', regsTOC, regsText)

allGuidesArticles = re.findall(r'<h2><([^>]*)><([^>]*)> Article ([A-Za-z0-9]+): ([^<]*)</h2>', guidesText)
guidesTOC = "<ul>\n" + "".join(["<li>Article " + num + ": <a href=\"#article-" + num + "-" + new + "\">" + title + "</a></li>\n" for (new, old, num, title) in allGuidesArticles]) + "</ul>\n"
guidesText   = re.sub(r'<table-of-contents>', guidesTOC, guidesText)


# Article Numbering. We want to
  # Support old links with meh names.
  # Support linking using just the number/letter (useful if you have to generate a link from a reference automatically, but don't have the name of the article).
  # Encourage a new format with the article number *and* better titles.
regsText   = re.sub(r'<h2><([^>]*)><([^>]*)> Article ([A-Za-z0-9]+):',
                    r'<span id="\2"></span><span id="\3"></span><h2 id="article-\3-\1"><a href="#article-\3-\1" class="local_link">Article \3</a>:', regsText)
guidesText = re.sub(r'<h2><([^>]*)><([^>]*)> Article ([A-Za-z0-9]+):',
                    r'<span id="\2"></span><span id="\3"></span><h2 id="article-\3-\1"><a href="#article-\3-\1" class="local_link">Article \3</a>:', guidesText)


regsText   = re.sub(r'<contents>',
                    r'<h2 id="contents"><a href="#contents">Contents</a></h2>', regsText)
guidesText = re.sub(r'<contents>',
                    r'<h2 id="contents"><a href="#contents">Contents</a></h2>', guidesText)

# Logo
regsText   = re.sub(r'<logo>',
                    r'<img src="wca_logo.svg" id="logo">', regsText)
guidesText = re.sub(r'<logo>',
                    r'<img src="wca_logo.svg" id="logo">', guidesText)

# Article hyperlinks
regsText   = re.sub(r'<Article ([^>]*)>',
                    r'<a href="#\1" class="article-link">Article \1</a>', regsText)
# In the Guidelines, Article hyperlinks still go to the Regulations
guidesText = re.sub(r'<Article ([^>]*)>',
                    r'<a href="./#\1" class="article-link">Article \1</a>', guidesText)

# Regulation hyperlinks
regsText   = re.sub(r'<Regulation ([^>]*)>',
                    r'<a href="#\1" class="regulation-link">Regulation \1</a>', regsText)
# In the Guidelines, Regulation hyperlinks still go to the Regulations
guidesText = re.sub(r'<Regulation ([^>]*)>',
                    r'<a href="./#\1" class="regulation-link">Regulation \1</a>', guidesText)

# Guideline hyperlinks from the Regulation. None right now, probably should never be (since the Regulations should be stand-alone)
regsText   = re.sub(r'<Guideline ([^>]*)>',
                    r'<a href="#\1" class="guideline-link">Guideline \1</a>', regsText)
# Guideline hyperlinks in the Guidelines
guidesText = re.sub(r'<Guideline ([^>]*)>',
                    r'<a href="guidelines.html#\1" class="guideline-link">Guideline \a>', guidesText)

regsText   = re.sub(r'<regs>WCA Regulations',
                    r'<a href="./">WCA Regulations</a>', regsText)
guidesText = re.sub(r'<regs>WCA Regulations',
                    r'<a href="./">WCA Regulations</a>', guidesText)

regsText   = re.sub(r'<guides>WCA Guidelines',
                    r'<a href="guidelines.html">WCA Guidelines</a>', regsText)
guidesText = re.sub(r'<guides>WCA Guidelines',
                    r'<a href="guidelines.html">WCA Guidelines</a>', guidesText)

regsText   = re.sub(r'<wca-title>WCA Regulations 2013',
                    r'<center><img src="WCA_logo_with_text.svg" alt="World Cube Association" class="logo_with_text"></center>\nCompetition Regulations 2013', regsText)
guidesText = re.sub(r'<wca-title>WCA Guidelines 2013',
                    r'<center><img src="WCA_logo_with_text.svg" alt="World Cube Association" class="logo_with_text"></center>\nCompetition Guidelines 2013', guidesText)

regsText   = re.sub(r'<p><version>([^<]*)</p>',
                    r'<div class="version">\1</div>', regsText)
guidesText = re.sub(r'<p><version>([^<]*)</p>',
                    r'<div class="version">\1</div>', guidesText)


fRegs = open(regsFileName, "w")
fRegs.write(regsText)
fRegs.close()

fGuides = open(guidesFileName, "w")
fGuides.write(guidesText)
fGuides.close()