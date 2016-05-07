import sys


class translationChecker():

  def __init__(self):
    sys.stdout.flush()
    self.regulations_set = self.readFile('wca-regulations/wca-regulations.md', False)
    self.guidelines_set = self.readFile('wca-regulations/wca-guidelines.md', True)

  # If isGuidelines is False, check that every regulation is indented
  # according to its number, that every lind number doesn't end with '+'.
  #
  # If isGuidelines if True, check that every regulation has no
  # indentation, that every line number ends with '+', that every
  # line has a label, and there are six different labels.
  #
  # Returns set of regulations numbers.
  def readFile(self, filename, isGuidelines):
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
        line_id = line[ind1 + 2 : ind2]
        numbers_set.add(line_id)

        if isGuidelines:
          # Check the absence of indentation.
          if line[0] != '-':
            print "Warning: %s:%d: line has indentation, while it shouldn't." % (filename, line_number)
            print line
            print

          # Check that there is a label.
          ind1, ind2 = line.find('['), line.find(']')
          if ind1 == -1 or ind2 == -1:
            print "Warning: %s:%d: line has no label in brackets." % (filename, line_number)
            print line
            print

          label = line[ind1 + 1 : ind2]
          labels_set.add(label)

          if line_id[-1] != '+':
            print "Warning: %s:%d: line id has no plus sign." % (filename, line_number)
            print line
            print

        else:
          # Some translations have tabs instead of spaces.
          line = line.replace('\t', '    ')
          # Check indentation.
          if len(line) - len(line.lstrip()) - 4 * lineIdLength(line_id) + 4 != 0:
            print "Warning: %s:%d: line has wrong indentation." % (filename, line_number)
            print line
            print

          if line_id[-1] == '+':
            print "Warning: %s:%d: line id has plus sign, while it shouldn't." % (filename, line_number)
            print line
            print

      # Check that there are 6 different labels.
      if isGuidelines:
        if len(labels_set) != 6:
          print "Warning: %s: file should have 6 different labels, but it has %d ones." % (filename, len(labels_set))
          print "These labels are: %s" % ", ".join(sorted(labels_set))
          print
    return numbers_set

  def checkTranslation(self, language):
    translation_regulations_set = self.readFile('translations/%s/wca-regulations.md' % language, False)
    checkEqualSets(self.regulations_set, translation_regulations_set)
    translation_guidelines_set = self.readFile('translations/%s/wca-guidelines.md' % language, True)
    checkEqualSets(self.guidelines_set, translation_guidelines_set)

# Checks that original regulations set coincide with translation one.
# If it is not the case, prints the difference.
def checkEqualSets(original_set, translation_set):
  printDifference(original_set, translation_set, 'These numbers are in the original file, but not in the translation one')
  printDifference(translation_set, original_set, 'These numbers are in the translation file, but not in the original one')

# Checks whether the first set has elements that are not in the second
# set. If there are, displays the text and missing elements.
def printDifference(set1, set2, display_text):
  diff_set = set1.difference(set2)
  if len(diff_set) > 0:
    print '%s: %s' % (display_text, ', '.join(sorted(diff_set)))
    print

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
    
