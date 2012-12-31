#!/usr/bin/python

import re

regsFileName = "wca-regulations.html"
guidesFileName = "wca-guidelines.html"

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
                    r'<li id="\1\2"><a href="#\1\2" class="local_link">\1\2</a>) <span class="\3 label linked"><a href="wca-regulations.html#\1">\3</a></span>', guidesText)
# Article Numbering. We want to
  # Support old links with meh names.
  # Support linking using just the number/letter (useful if you have to generate a link from a reference automatically, but don't have the name of the article).
  # Encourage a new format with the article number *and* better titles.
regsText   = re.sub(r'<h2><([^>]*)><([^>]*)> Article ([A-Za-z0-9]+):',
                    r'<span id="\2"></span><span id="\3"></span><h2 id="article-\3-\1"><a href="#article-\3-\1" class="local_link">Article \3</a>:', regsText)
guidesText = re.sub(r'<h2><([^>]*)><([^>]*)> Article ([A-Za-z0-9]+):',
                    r'<span id="\2"></span><span id="\3"></span><h2 id="article-\3-\1"><a href="#article-\3-\1" class="local_link">Article \3</a>:', guidesText)
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
                    r'<a href="wca-regulations.html#\1" class="article-link">Article \1</a>', guidesText)
# Regulation hyperlinks
regsText   = re.sub(r'<Regulation ([^>]*)>',
                    r'<a href="#\1" class="regulation-link">Regulation \1</a>', regsText)
# In the Guidelines, Regulation hyperlinks still go to the Regulations
guidesText = re.sub(r'<Regulation ([^>]*)>',
                    r'<a href="wca-regulations.html#\1" class="regulation-link">Regulation \1</a>', guidesText)
# Guideline hyperlinks from the Regulation. None right now, probably should never be (since the Regulations should be stand-alone)
regsText   = re.sub(r'<Guideline ([^>]*)>',
                    r'<a href="#\1" class="guideline-link">Guideline \1</a>', regsText)
# Guideline hyperlinks in the Guidelines
guidesText = re.sub(r'<Guideline ([^>]*)>',
                    r'<a href="wca-guidelines.html#\1" class="guideline-link">Guideline \1</a>', guidesText)

regsText   = re.sub(r'<WCA Regulations>',
                    r'<a href="wca-regulations.html">WCA Regulations</a>', regsText)
guidesText = re.sub(r'<WCA Regulations>',
                    r'<a href="wca-regulations.html">WCA Regulations</a>', guidesText)

regsText   = re.sub(r'<WCA Guidelines>',
                    r'<a href="wca-guidelines.html">WCA Guidelines</a>', regsText)
guidesText = re.sub(r'<WCA Guidelines>',
                    r'<a href="wca-guidelines.html">WCA Guidelines</a>', guidesText)


fRegs = open(regsFileName, "w")
fRegs.write(regsText)
fRegs.close()

fGuides = open(guidesFileName, "w")
fGuides.write(guidesText)
fGuides.close()