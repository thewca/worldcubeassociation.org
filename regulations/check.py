import sys


class TranslationChecker():

  def __init__(self):
    self.regulations_set = self.readFile('wca-regulations/wca-regulations.md', False, '[english]  ')
    self.guidelines_set = self.readFile('wca-regulations/wca-guidelines.md', True, '[english]  ')

  # If isGuidelines is False, check that every regulation is indented
  # according to its number, that every line number doesn't end with '+'.
  #
  # If isGuidelines if True, check that every regulation has no
  # indentation, that every line number ends with '+', that every
  # line has a label, and there are six different labels.
  #
  # Returns set of regulations numbers.
  def readFile(self, filename, isGuidelines, language_prefix):
    numbers_set = set()
    found_table_of_contents = False
    labels_set = set()

    with open(filename, 'r') as input_file:
      for line_number, line in enumerate(input_file):
        line_number += 1
        line = line.rstrip('\n')

        # Skip everything before <table-of-contents>.
        if not found_table_of_contents:
          if line == '<table-of-contents>':
            found_table_of_contents = True
          continue

        # Ignore empty lines or lines that start with '<' or '#'.
        if line == '' or line[0] == '<' or line[0] == '#':
          continue

        # Try to extract regulation number. If there is no number, skip.
        ind1, ind2 = line.find('- '), line.find(')')
        if ind1 == -1 or ind2 == -1:
          continue
        line_id = line[ind1 + len('- ') : ind2]
        numbers_set.add(line_id)

        if isGuidelines:
          # Check the absence of indentation.
          if line[0] != '-':
            print "%s/!\ Warning: %s:%d: line has indentation, while it shouldn't." % (language_prefix, filename, line_number)
            print language_prefix, line
            print language_prefix

          # Check that there is a label.
          ind1, ind2 = line.find('['), line.find(']')
          if ind1 == -1 or ind2 == -1:
            print "%s/!\ Warning: %s:%d: line has no label in brackets." % (language_prefix, filename, line_number)
            print language_prefix, line
            print language_prefix

          label = line[ind1 + 1 : ind2]
          if label == '':
            print "%s/!\ Warning: %s:%d: label is empty." % (language_prefix, filename, line_number)
            print language_prefix, line
            print language_prefix
          else:
            labels_set.add(label)

          if line_id[-1] != '+':
            print "%s/!\ Warning: %s:%d: line id has no plus sign." % (language_prefix, filename, line_number)
            print language_prefix, line
            print language_prefix

        else:
          # Some translations have tabs instead of spaces.
          SPACES_PER_INDENT = 4
          line = line.replace('\t', ' ' * SPACES_PER_INDENT)
          # Check indentation.
          if len(line) - len(line.lstrip()) - SPACES_PER_INDENT * (lineIdLength(line_id) - 1) != 0:
            print "%s/!\ Warning: %s:%d: line has wrong indentation." % (language_prefix, filename, line_number)
            print language_prefix, line
            print language_prefix

          if line_id[-1] == '+':
            print "%s/!\ Warning: %s:%d: line id has plus sign, while it shouldn't." % (language_prefix, filename, line_number)
            print language_prefix, line
            print language_prefix

      # Check that there are 6 different labels.
      if isGuidelines:
        if len(labels_set) != 6:
          print "%s/!\ Warning: %s: file should have 6 different labels, but it has %d ones." % (language_prefix, filename, len(labels_set))
          print "%sThese labels are: %s" % (language_prefix, ", ".join(sorted(labels_set)))
          print language_prefix
    return numbers_set

  def checkTranslation(self, language, language_prefix):
    translation_regulations_set = self.readFile('translations/%s/wca-regulations.md' % language, False, language_prefix)
    checkEqualSets(self.regulations_set, translation_regulations_set, language_prefix)
    translation_guidelines_set = self.readFile('translations/%s/wca-guidelines.md' % language, True, language_prefix)
    checkEqualSets(self.guidelines_set, translation_guidelines_set, language_prefix)

# Checks that original regulations set coincide with translation one.
# If it is not the case, prints the difference.
def checkEqualSets(original_set, translation_set, language_prefix):
  printDifference(original_set, translation_set, language_prefix, 'These numbers are in the original file, but not in the translation one')
  printDifference(translation_set, original_set, language_prefix, 'These numbers are in the translation file, but not in the original one')

# Checks whether the first set has elements that are not in the second
# set. If there are, displays the text and missing elements.
def printDifference(set1, set2, language_prefix, display_text):
  diff_set = set1.difference(set2)
  if len(diff_set) > 0:
    print '%s/!\ Warning: %s: %s' % (language_prefix, display_text, ', '.join(sorted(diff_set)))
    print language_prefix

# Calculates the number of alternations of letters and digits.
def lineIdLength(line_id):
  def symbolType(c):
    if c.isalpha():
      return 1
    return 2

  cnt = 0
  for i in xrange(len(line_id) - 1):
    if symbolType(line_id[i]) != symbolType(line_id[i + 1]):
      cnt += 1
  return cnt
    
