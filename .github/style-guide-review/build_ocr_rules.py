import json
import re
import sys
from pathlib import Path

FRONT_MATTER = re.compile(r"\A---\n.*?\n---\n+", re.DOTALL)
DOUBLESTAR_SPECIAL = re.compile(r"([*?\[\]{}\\])")


def read_guide(guide_dir, name):
    return FRONT_MATTER.sub("", (guide_dir / name).read_text())


# Mirrors OCR's doublestar matching (case-insensitive) for the globs rules.json uses.
def glob_to_regex(pattern):
    regex = re.escape(pattern.lower())
    regex = regex.replace(r"\*\*/", "(?:.*/)?").replace(r"\*\*", ".*")
    regex = regex.replace(r"\*", "[^/]*").replace(r"\?", "[^/]")
    regex = re.sub(r"\\\{(.*?)\\\}", lambda m: "(?:" + m.group(1).replace(",", "|") + ")", regex)
    return re.compile(regex + r"\Z")


# OCR's `include` is not a whitelist, so files no rule covers would get its
# generic review. Excluding them by exact path keeps the review to the guide.
def uncovered_files(rule_paths, changed_files):
    matchers = [glob_to_regex(path) for path in rule_paths]
    return [
        DOUBLESTAR_SPECIAL.sub(r"\\\1", file)
        for file in changed_files
        if not any(matcher.match(file.lower()) for matcher in matchers)
    ]


def main(template_path, guide_dir, changed_files_path, out_path):
    template = json.loads(Path(template_path).read_text())
    guide_dir = Path(guide_dir)
    main_guide = read_guide(guide_dir, "style_guide.md")
    changed_files = Path(changed_files_path).read_text().splitlines()

    rules = [
        {
            "path": rule["path"],
            "rule": "\n\n".join([
                "Review this file against the WCA style guide below.",
                main_guide,
                *(read_guide(guide_dir, name) for name in rule["guides"]),
                template["instructions"],
            ]),
        }
        for rule in template["rules"]
    ]

    exclude = template["exclude"] + uncovered_files([rule["path"] for rule in template["rules"]], changed_files)
    ocr_rules = {"include": template["include"], "exclude": exclude, "rules": rules}
    Path(out_path).write_text(json.dumps(ocr_rules, indent=2))


if __name__ == "__main__":
    main(*sys.argv[1:])
