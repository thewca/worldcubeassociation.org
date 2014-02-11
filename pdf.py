import os
import re
import shutil
import subprocess


def md2tex(filename):

  return subprocess.check_output([
    "pandoc",
    "--from", "markdown",
    "--to", "latex",
    "--ascii",
    filename
  ])


class pdf():

  documentclass = """\documentclass[12pt]{article}
  """

  header = """
\usepackage[top=2cm, bottom=2cm, left=2cm, right=2cm]{geometry}

\usepackage[bookmarksopen=true]{hyperref}
\hypersetup{pdfborderstyle={/S/U/W 1},pdfborder=0 0 1}

\usepackage{bookmark}

\usepackage{fancyhdr}
\pagestyle{fancy}

\setcounter{secnumdepth}{-1}

\\title{WCA Regulations and Guidelines}
\\author{WCA Regulations Committee}
\date{\\vspace{-1em}}

\\begin{document}

\maketitle
"""

  middle = """
\\newpage
"""

  footer = """
\end{document}
"""

  encoding = {
    "cjk": """
\usepackage{xeCJK}
\setCJKmainfont{AR PL UMing CN}
""",
    "default": """
""",
    "hungarian": """
\usepackage[magyar]{babel}
\usepackage[T1]{fontenc}
\usepackage[utf8x]{inputenc}
""",
    "korean": """
\usepackage[fallback]{xeCJK}
\usepackage{fontspec}
\setCJKmainfont{UnBatang}
""",
    "russian": """
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
""",
    "utf8": """
\usepackage[utf8]{inputenc}
"""
  }

  def __init__(self, language, translation, pdf_name, tex_encoding, tex_command):

    self.docs_folder = "translations/" + language if translation else "wca-documents"
    self.temp_folder = "temp/" + language
    self.build_folder = "build/translations/" + language if translation else "build"

    regulations_text = re.sub("--", "-{}-", md2tex(self.docs_folder + "/wca-regulations.md"))
    guidelines_text = re.sub("--", "-{}-", md2tex(self.docs_folder + "/wca-guidelines.md"))

    if not os.path.exists(self.temp_folder):
      os.makedirs(self.temp_folder)

    print self.header

    text = "\n".join([
              self.documentclass,
              self.encoding[tex_encoding],
              self.header,
              regulations_text,
              self.middle,
              guidelines_text,
              self.footer
           ])

    tex_file = self.temp_folder + "/" + pdf_name + ".tex"
    with open(tex_file, "w") as f:
      f.write(text)

    subprocess.check_call([
      tex_command,
      "-halt-on-error",
      "-output-directory", self.temp_folder,
      tex_file
    ])

    shutil.copy(
      self.temp_folder + "/" + pdf_name + ".pdf",
      self.build_folder + "/" + pdf_name + ".pdf"
    )
