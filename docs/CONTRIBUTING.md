# Contributing to worldcubeassociation.org

This guide captures the process of submitting a code change to our repository, from opening a PR
up to getting the feature merged and deployed. It was derived by an LLM based on the real,
human review history on this repository, so every rule here is something that has been asked for
repeatedly on real pull requests. It is current through review comments up to 2026-08-24
and has been further revised and refined by Senior Members of WST.

**Scope**: This guide covers the *process* around a change: how to scope a pull request, what belongs in the
description, how to respond to review, and which changes need agreement from outside the PR.
It is the companion to [`STYLE_GUIDE.md`](STYLE_GUIDE.md), which covers how the code itself should be written.

For getting the app running locally, see the
[quickstart](https://docs.worldcubeassociation.org/contributing/quickstart) and the
[detailed contributing guide](https://docs.worldcubeassociation.org/contributing/detailed_contributing_guide.html).

---

## Table of contents

1. [One PR, one purpose](#1-one-pr-one-purpose)
2. [Before you push](#2-before-you-push)
3. [The PR description](#3-the-pr-description)
4. [Responding to review](#4-responding-to-review)
5. [Changes that need more than a reviewer](#5-changes-that-need-more-than-a-reviewer)

---

## 1. One PR, one purpose

Every changed line must trace to the stated purpose of the PR. Unrelated diff hides the real change,
distracts the focus of the reviewer and makes `git blame` useless.

- Don't rename variables, reformat, or "improve" adjacent code just because you happen to be touching
  the same file.
  - Don't shorten `result` to `r` (or lengthen it) mid-refactor — the diff noise costs more than the
    readability gain.
  - Notice unrelated dead code? Mention it in a comment. Don't delete it in this PR.
  - If you catch a typo in a code comment, you may change it at your discretion as an exception to this rule.
    If the typo is in a variable name that would have a lot of trailing refactoring changes, mention it
    in a comment and let someone else handle it in a subsequent PR.
- Split refactors from features where possible. "Seems best not to do too much in one PR."
- Tooling config (`.eslintrc.json`, `.rubocop.yml`) counts as unrelated too. Improvements there are
  welcome, but as their own PR — a lint-rule change buried in a feature diff will be asked out.
  - When changing lint rules, you are expected to run the linter over the whole codebase and apply the
    changed/updated rule throughout. This creates too much "noise" in the diff of an existing feature PR.

### 1.1 Generated files and noisy diffs

- If a generated file (`src/types/openapi.ts`, `importMap.js`, `yarn.lock`, `schema.rb`) shows changes
  you didn't intend, delete and regenerate it, or merge `main` first.
  - Our CI re-runs codegen on relevant files like OpenAPI types, Payload types and Chakra types for the frontend.
    It will fail the whole CI run if there is a diff in these files which is not committed to your PR.
- If the noise persists on `main`, push a separate hotfix PR that *only* fixes the generated file.
- In general, merge `main` to clear unrelated changes from your diff.
- If a file move wasn't detected as a rename (for example, because you also made substantial edits during the move),
  leave a review comment on the diff saying where it came from.

---

## 2. Before you push

RuboCop (`.rubocop.yml`), ESLint (`next-frontend/eslint.config.mjs`) and Prettier are the source of
truth for formatting and for mechanical rules. Run them before you push, and don't argue with them in
review — if a rule is wrong, that's a separate PR against the config (see [§1](#1-one-pr-one-purpose)).

---

## 3. The PR description

- If your description and your diff disagree (you claim it's a "comment-only fix" but it changes display logic),
  the reviewer will refer to the diff and ask. Keep the description accurate.
- Explain non-obvious decisions proactively. "If it isn't straight-forward, explain in two or three
  sentences why this is the cleanest code you could come up with" is an accepted solution — silence
  is not.
  - Adding review comments to your own PR can be helpful for reviewers, but it is not required for every
    single PR in general. Only do so when it adds a substantial, helpful context for reviewers and
    otherwise make sure you're not polluting your own PR.
  - Comments about specific design choices or architectural solutions belong inside the committed code directly,
    see the [style guide](STYLE_GUIDE.md) for details.
- If you used an LLM to produce a solution, you still own it: be able to justify why it's the right
  approach. See the LLM rules in our [README](../README.md#llm-policy) for more details.

---

## 4. Responding to review

- **Respond to every review comment.** Resolving a thread without a code change *and* without a reply
  is generally useless: Marking a thread resolved is not the same as addressing it. If you
  left the concern untouched, say so and say why. If you disagree, say why.
- Unresolved `TODO`s in the diff need a decision: either fix it in this PR or say explicitly that
  it's a note for later.

---

## 5. Changes that need more than a reviewer

Some changes can't be settled inside the PR, however good the code is. Raise these early — finding out
at review time costs you a round trip.

- **New public vocabulary.** When introducing new terminology to competitors ("locked", "Dual
  Rounds"), get community/WCT/WQAC/WRC input before it lands in `en.yml` — don't invent public vocabulary
  in a PR.
- **Unreleased features.** Don't advertise features that aren't publicly released yet.
- **One-off data fixes.** These ship as Rake tasks rather than migrations ([STYLE_GUIDE §3.10](STYLE_GUIDE.md#310-jobs-and-rake-tasks)), and a
  WST senior member runs them after deploy — say so in your description so the run gets scheduled.
  - At present (2026-09-24) we do not have a cleanly established process around running Rake tasks. It's really
    a matter of ad-hoc scheduling and coordinating with Senior Members who have the required privileges
    to do stuff on our live production servers. "Discuss on Slack" is the best guidance we can give
    at the moment.
