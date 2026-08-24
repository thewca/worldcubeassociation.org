# Contributing to worldcubeassociation.org

This document covers the *process* around a change: how to scope a pull request, what belongs in the
description, how to respond to review, and which changes need agreement from outside the PR.

It is the companion to [`STYLE_GUIDE.md`](STYLE_GUIDE.md), which covers how the code itself should be
written. Both were derived from the review history on this repository, so every rule here is
something that has been asked for repeatedly on real pull requests. Current through review comments
up to 2026-08-24.

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

Every changed line must trace to the stated purpose of the PR. Unrelated diff is the single most
common review complaint: it hides the real change and makes `git blame` useless.

- Don't rename variables, reformat, or "improve" adjacent code you happen to be touching.
- Don't shorten `result` to `r` (or lengthen it) mid-refactor — the diff noise costs more than the
  readability gain.
- Notice unrelated dead code? Mention it in a comment. Don't delete it in this PR.
- Split refactors from features. "Seems best not to do too much in one PR."
- Tooling config (`.eslintrc.json`, `.rubocop.yml`) counts as unrelated too. Improvements there are
  welcome, but as their own PR — a lint-rule change buried in a feature diff will be asked out.

### 1.1 Generated files and noisy diffs

- If a generated file (`src/types/openapi.ts`, `importMap.js`, `yarn.lock`, `schema.rb`) shows changes
  you didn't intend, delete and regenerate it, or merge `main` first.
- If the noise persists on `main`, push a separate hotfix PR that *only* fixes the generated file.
- Merge `main` to clear unrelated changes from your diff.
- If a file move wasn't detected as a rename, leave a comment on the diff saying where it came from.

---

## 2. Before you push

RuboCop (`.rubocop.yml`), ESLint (`next-frontend/eslint.config.mjs`) and Prettier are the source of
truth for formatting and for mechanical rules. Run them before you push, and don't argue with them in
review — if a rule is wrong, that's a separate PR against the config (see [§1](#1-one-pr-one-purpose)).

---

## 3. The PR description

- If your description and your diff disagree ("comment-only fix" that changes display logic), the
  reviewer will trust the diff and ask. Keep the description accurate.
- Explain non-obvious decisions proactively. "If it doesn't work out, explain in two or three
  sentences why this is the cleanest code you could come up with" is an accepted answer — silence
  is not.
- If you used an LLM to produce a solution, you still own it: be able to justify why it's the right
  approach.

---

## 4. Responding to review

- **Respond to every review comment.** Resolving a thread without a code change *and* without a reply
  is the fastest way to stall a PR. Marking a thread resolved is not the same as addressing it: if you
  left the concern untouched, say so and say why. If you disagree, say why.
- Unresolved `TODO`s in the diff need a decision: either fix it in this PR or say explicitly that
  it's a note for later.

---

## 5. Changes that need more than a reviewer

Some changes can't be settled inside the PR, however good the code is. Raise these early — finding out
at review time costs you a round trip.

- **New public vocabulary.** When introducing new terminology to competitors ("locked", "Dual
  Rounds"), get community/WCT/WQAC input before it lands in `en.yml` — don't invent public vocabulary
  in a PR.
- **Unreleased features.** Don't advertise features that aren't publicly released yet.
- **One-off data fixes.** These ship as rake tasks rather than migrations (STYLE_GUIDE §3.9), and a
  WST senior member runs them after deploy — say so in your description so the run gets scheduled.
