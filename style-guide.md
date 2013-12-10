# Style Guide and Comments on the WCA Regulations

This document is meant to clarify some of the implicit conventions adopted in WCA documents.

## General Information

- The documents are formatted in [Markdown](http://daringfireball.net/projects/markdown/), a plain-text format created by John Gruber. This makes it easy to focus on the raw text (and any changes), so that it is readable on its own and can also be converted into a fancier format (i.e. HTML).
  - Indentation is four spaces, and nested for the Regulations and the Constitution.
  - The Guidelines have an irregular correspondence to numbering in the Regulations, thus Guidelines have no indentation in the source.
- To make the regulations easier to read we use 'he' where the reader should read 'she or he'.
- The division into Regulations Guidelines roughly mirrors the normative vs. non-normative (informative) distinction employed by W3C standards.
  - The use of the words 'must (not)', 'shall (not)', 'should (not)', and 'may (not)' (requirement levels) conform to RFC 2119. In particular, note that "shall" indicates a (non-optional) requirement.
  - The Regulations must not rely on the Guidelines for completeness or consistency. Any normative Guidelines must be be implicit in the Regulations (e.g. labelled [REMINDER]).
  - As a rule of thumb, anything with 'must' or 'shall' should be in the Regulations, and anything with 'should' or 'may' should be in the Guidelines.
- The documents are written in British English.


## Formatting Conventions

### Specific Formatting in Markdown.

- The Regulations should limit itself to standard ASCII, for maximum encoding compatibility. This facilitates safe conversion and parsing.
    - 'Degrees' should be spelled out instead of using the degree sign.

### Formatting the Document

- Ensure that the Regulations are well-constructed and organised. This is common sense, but requires conscious effort:
  - Foremost, make the Regulations easy for a human to search and read, and don't let anything get in the way of accuracy and clarity.
    - For example, put the main subject of a Regulation near the beginning, even if the grammar might be neater otherwise (see Regulations 9f4 and 9f5 for a good example).
  - Keep it 'DRY' ('Don't Repeat Yourself').
    - As a rule of thumb, if a change in one place requires a change in another place to keep the Regulations consistent, it's not DRY.
  - Use consistent formatting to help make the document easier to understand for a human and to search by computer (e.g. every rule that can result in a DNF explicitly mentions 'DNF').
  - Address contingencies that help ensure fair interpretation across different competitions, but leave unusual exceptions to the WCA Delegate. (In a sense, the Guidelines are a formalised FAQ to standardise unwritten rules).
  - Future-proof the documents for subsequent changes (e.g. don't assume that cross-references remain valid, don't construct delicately related rules).
- NOTE: There are many gaps in the numbering of the Regulations. This is because we don't change around numberings when a Regulation is removed. For the same reason, there is now no Article 6.
  - When adding a Regulation an article/list of sub-regulations, make sure that you don't number it the same as a deleted regulation from a previous official version.

### Specific Formatting Conventions

- Most formatting conventions can be inferred from the documents themselves. This includes the following:
  - Indentation and spacing.
    - Conservative levels of indentation (at most three in the Regulations and Guidelines).
  - Listing examples (either in parentheses or numbered bullets)
    - Use of 'e.g.' and 'i.e.' (instead of "for example"/"that is").
    - Use of the serial comma.
  - Punctuation:
    - Single quote marks, not double quote marks.
    - 'Logical punctuation' (whether to place punctuation inside quotes).
    - Use of comma/colon/semicolon.
    - Punctuation at the end of every line.
  - Capitalization and spelling.
  - Formatting of references (e.g. to Articles/Regulations/Guidelines).
  - Write numbers as numerals when possible.


### Terms and Capitalization

- References to the '(WCA) Regulations' and '(WCA) Guidelines' are capitalised. For example, Regulation 1a) is a regulation in the Regulations. This makes it clear that 'Regulations' refers to the body of the WCA Regulations.
- Also should be capitalised: Competitors Area.
- The WCA Delegate should be mentioned by his full title.
- Puzzles names are capitalised. Event formats like 'One-Handed Solving' are also capitalised. A puzzle name + event format should omit the word 'Solving' (e.g. Rubik's Cube: One-Handed). See Regulation 9b for official puzzles and event formats.

### Recommended Word Choices

- 'Puzzle' instead of 'cube', wherever applicable.
- 'Regulation' or 'Guideline' instead of 'rule'.
- 'Result' instead of 'score' (except for 'score sheet' and 'score taker').
- 'Ranking' instead of 'rank'.
- 'Permitted' instead of 'allowed'
- 'Attempt' instead of 'solve' (unless specifically referring to the timed portion).
- 'Scramble sequence' instead of 'scramble'.
- 'Start' instead of 'begin'.
- 'Stop' instead of 'halt' or 'finish'
- 'Registration' instead of 'pre-registration' (unless specifically referring to registration before the day of the competition).
- A judge '[shall] call' instead of 'says'.
- 'Score sheet' (two words) instead of 'score card'.
- 'Apply' (moves or scramble sequence) instead of 'perform' or 'do'.
- 'Assign' (a penalty) instead of 'apply'.
- 'Record' a result instead of 'write down'.
- 'Thus' instead of 'thereby'.
- 'Discretion' (of the delegate) instead of 'consent'.
- 'State' (of a puzzle) instead of 'position'.
- 'Allot' (a maximum number of attempts) instead of 'give'.
- 'Choose' instead of 'decide'.
- 'Spectators' instead of 'audience'.

- 'If X, ...' instead of 'Should X be the case, ...'.
- 'For X, ...' or 'during X, ...' instead of 'In X, ...'

- 'Start' and 'stop' (verbs).
- 'Beginning' and 'end' (nouns).
- 'Finish' (verb).
- 'Completed' (adjective).

- 'All' (collective) instead of 'every'.
- 'Each' (individual).
- 'Any' (potential, i.e. in case of applicability).

### Notable Differences between the Regulations and Common Use

- For consistency, event formats have 'Solving' as a separate word, e.g. 'Speed Solving' and 'Fewest Moves Solving'.

### Checklist for formatting the Regulations

- Re-normalise indentation. (Use re-indent.sh, but make sure to adapt the script source for the document and sanity-diff the changes.)
- Search for stray tabs, double-spaces, extra spaces/missing punctuation at the end of lines.
- When searching for words/phrases, be careful about alternate spellings and search for a conservative substring (e.g. search "solv" for "solve"/"solving", "apple" for "apply"/"applied", "penalt" for "penalty"/"penalties"). Be careful about a blind search/replace.


## Definitions

- Scramble sequence: A list of moves ('algorithm') used to scramble a puzzle. Informally also called a 'scramble'.
- Scramble: The scrambled state of a puzzle after a scramble sequence has been applied to it.
- Attempt: The time frame starting when the competitor acknowledges his readiness to begin (see Regulation A3b2) and ending when the score sheet is complete (see Regulation A7c).
- Solve: Generally, the part of the attempt when the timer is running.
- Original recorded time: The time showing on the timer/stopwatch, before time penalties.
- Result: An official time, either the time for an attempt including penalties, or a derived result (e.g. mean/average).
- Rankings: An ordered list of results (e.g. first round rankings, world rankings).
- Ranking/Rank: An ordinal number representing a result's order in a list of results (e.g. ranking in a round, world rank).
- Record: A best-ranked result (e.g. of comparable results for a region, or of results for a competitor)
