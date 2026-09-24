# WCA Codebase Style Guide

This guide captures the conventions that WCA maintainers actually apply in code review. It was
derived by an LLM from ~1,800 review comments on this repository, so every rule here is something
that has been asked for repeatedly on real pull requests. It is current through review comments up to
2026-08-24 and has been revised by Senior Members of WST.

**Scope:** This guide covers things a linter *cannot* catch. RuboCop (`.rubocop.yml`), ESLint
(`next-frontend/eslint.config.mjs`) and Prettier are the source of truth for formatting and for
mechanical rules — this guide won't repeat them.

This guide covers the *code* itself. The process around changing code — how to scope a PR,
what goes in the description, how to respond to review, which changes need sign-off
outside the PR — lives in [`CONTRIBUTING.md`](CONTRIBUTING.md).

**How to read it:** rules are stated as imperatives. Each one has a short *why*, because a rule you
understand is a rule you can apply to a case this document didn't anticipate.

**Topic guides:** sections that only apply to one corner of the codebase live in their own file under
[`style/`](style/), each opening with the condition that makes it relevant. Read a topic guide when
you're in that corner and skip it otherwise — that goes for people and for coding agents, which
should load them on demand rather than carrying every rule at once. If your editor or agent supports
"load this file when working on X" rules, point it at these files; keep that config personal
(`.claude/` and `.agents/` are gitignored) so we don't have to agree on a tool.

---

## Table of contents

1. [Universal principles](#1-universal-principles)
2. [Naming](#2-naming)
3. [Ruby and Rails](#3-ruby-and-rails)
4. [Database and migrations](#4-database-and-migrations)
5. [API design](#5-api-design)
6. [Next.js frontend](#6-nextjs-frontend)
7. [Chakra UI and styling](#7-chakra-ui-and-styling)
8. [Legacy React (Webpacker / Semantic UI)](style/legacy-frontend.md)
9. [Tests](style/tests.md)
10. [i18n and user-facing copy](#10-i18n-and-user-facing-copy)

---

## 1. Universal principles

### 1.1 Prefer immutable operations

In-place mutation is treated as a defect. Use immutable, functional-style data flow throughout.
This applies to any area of the code, regardless of programming language or framework.

| Don't                                 | Do                                                   |
|---------------------------------------|------------------------------------------------------|
| `array.sort(...)`                     | `array.toSorted(...)`                                |
| `map.set(k, v)` in a `forEach`        | build a new object via spread / `Object.fromEntries` |
| `array.pop()`, `arr.tap(&:pop)`       | `take_while` / `drop_while` / slicing                |
| `let x = ...` then reassign in a loop | build a new collection with `map` / `reduce`         |

In JavaScript, `let` is itself the smell: it tells the reader "something below reassigns this", and
reviewers will ask for a `const` built from a `map`, a `reduce`, or a ternary.

In Ruby, variables are declared "on the fly" without designated keywords, so you need to be extra-careful.
In-place mutation is hard to spot at first glance, and for this reason, you will find some places
in our backend which still do it. It does not give you an excuse to copy that behavior, however.

If you genuinely must recompute values in place, produce *new* entries rather than mutating existing
ones. **Exception**: The Ruby backend may mutate attributes of database entities in-place. Do not create
a copy of a `ScheduleActivity` row just to change the name from "Lunch" to "Lunch break".

Mutating an object you were handed is only the very last resort and has to be argued for _very strongly_
in the PR description — assume your PR isn't granted any exceptions.

### 1.2 No magic values

Every literal that isn't self-evidently meaningful gets a name.

- Backend: a module-level or class-level constant. Even for values that are "obviously 2 today"
  because the _current_ Regulations only support linking 2 rounds into a "Dual Round": Derive them
  cleanly (`linked_round.rounds.size`), so the code survives the 2031 Regulations change
  introducing Triple Rounds.
- Frontend: a design token (`fontSize="2xl"`, `w="full"`, see [Chakra](style/next-frontend.md))
  or a named `const`. Raw `44`, `1`, `#3B82F6` will be questioned.
- If a constant comes from an external protocol (an AnyCable message key, a keyboard code), document
  where it comes from in a comment next to the declaration.

### 1.3 Comment the *why*, not the *what*

If your comment needs to explain _what_ the code is doing in the first place, then it's a pretty strong
indicator you should consider a refactor. We value hand-crafted code with variable names and control flow
that is self-explanatory.

The core purpose of a comment should be to explain the **Why** or the **How** of your code: It is already
clear what the code is doing, but it might not be clear _why_ you're doing it or _how_ this self-explanatory
code snippet solves the bigger problem and ties back into the bigger picture. In particular, code comments
are required when:

- You worked around a library bug or quirk (`initialData` type inference through `api.queryOptions`,
  Redocly `allOf` handling, the `use client` directive needed for icon functions).
  - If you feel that the library quirk you just worked around clearly is a bug in the original library,
    report it to their issue tracker (mostly GitHub Issues) and add a code comment referencing your issue.
  - If you feel that your workaround "should be useful" for the library, still consider reporting it
    as a feature suggestion or open-ended discussion. Most open source projects value constructive feedback.
- Your code depends on non-obvious ordering, indexing, or a business rule (e.g. filtering after a
  `map` because you need the original index).
- You ported logic from another codebase (WCA Live, a Ruby equivalent) — say so and name the source.

Some LLMs have a particular tendency to be very verbose about the "Why": They explain stuff in great detail,
often down to "This works because in the third-party library code line 336, the fooBar() function does so-and-so,
leading to this-and-that result, and the subsequent processor cycles run the calculations in exactly
oh-so-many seconds thanks to the way modern NAND gates are structured, so it produces the desired outcome".
This level of detail is not helpful! Rather than a blanket "Why this works", you should strive for:
- "Why this works **for us**"
- "Why this solution is adequate to the problem"
- "How this ties neatly into the conventions of our framework/this third-party library"

A note about future removal is welcome when it's *actionable*. Mark it so it's greppable (`TODO`,
`XXX`) and name the condition that makes it removable — "TODO: drop once WCA Live is sunset" tells
the next reader what to wait for. What doesn't help is an unmarked aside saying the code is temporary
without saying temporary until when. A `TODO` you're leaving deliberately still needs to be called
out in review; see [CONTRIBUTING.md §4](CONTRIBUTING.md#4-responding-to-review).

### 1.4 Don't paper over errors

We generally do not catch errors (JS `try`/`catch`, Ruby `rescue`), and we also try to avoid throwing errors
apart from some very specific use-cases.

- `try`/`catch` (or `rescue`) around something that "sometimes explodes" is not acceptable. Find out
  *what* throws and prevent that input from reaching the call.
- Don't null-guard defensively (`?.`, `&.`, `!`, `?? 0`) without knowing which case you're guarding.
  If you can't name the case, the guard is hiding a bug — or it's dead code.
- If you branch on format ("if it parses as JSON do X, else treat it as CSV"), validate the else
  branch too and react meaningfully when it's neither.
- Don't swallow failures silently. See also [§3.5](#35-bang-methods-and-failed-writes).

A notable exception where we do work with errors are Controllers in the Ruby on Rails framework
(i.e. the HTTP layer of our API). The following rules there apply:
- A `rescue` inside a method body is rejected. In a controller, catch the exception at the top with
  `rescue_from` (`rescue_from JSON::Schema::ValidationError`) — the happy path stays readable and
  every action gets the same handling.
- You can `raise` an error/exception when you know that it's handled further up in the controller hierarchy.
  For example, one common pattern you will see is `raise WcaExceptions::NotPermitted` to stipulate a 403.

### 1.5 Reuse existing code before writing new code

Before introducing a helper, search for one. Core results logic in particular must live in exactly
one place so that a bug fix fixes every caller. Concretely, the codebase already has:
- `SolveTime` parsers
- `ScheduleActivity.parse_activity_code`
- `Registrations::Lanes::Competing`
- `RegistrationChecker#apply_payload`
- `Competition.wcif_json_schema`
- `Competition.validate_wcif_schema!`
- `useInputState`
- `fetchJsonOrError`
- `routes.js.erb` link helpers
- the OpenAPI error component.

Ask around before re-implementing any of them — if you feel like it should be a common, extracted method
then chances are that it already is one and your colleagues know where the code can be found.

This is particularly important for the libraries we depend on. Before hand-coding something commonplace like
a character limit on an editor, a debounce, a flag icon — read that package's documentation and check
whether it's already a prop or an option. Chances are, you can find a pre-packaged solution for whatever
you're trying to accomplish.

If you're writing some new business logic, and you're sure it's not available elsewhere yet, consider
moving it to a shared helper function that others can benefit from.

---

## 2. Naming

### 2.1 Names describe what something *means*, not how it was computed

Variable naming across all frameworks and all programming languages should always be meaningful.
The flow of the code (to reach the variable declaration) already tells you how it was computed.
So the name of the variable should instead tell you what its _purpose_ is, and how it fits into
the logic of the function or the component.

| Bad                           | Good                                                                               |
|-------------------------------|------------------------------------------------------------------------------------|
| `hash`                        | `state_hash` or `round_checksum`                                                   |
| `Errored`                     | `OpenapiError`                                                                     |
| `last_event` that holds an ID | `last_event_id`, or change the value of the variable to actually be the full event |

### 2.2 Shape must match the name

- A `*ByX` suffix means it's a map keyed by X. If it's an array, rename it (or turn it into a map keyed by X).
- `statMap` should actually be an object/map, not an array of objects.
- Plural variable names imply an array of values/objects. Singular variable names imply that it's just one object.
- `withResults` reads as "definitely has results". If you mean "a tuple of competitor and result", name it accordingly.

### 2.3 Use established WCA vocabulary

The WCA has established terminology for a lot of things relevant to cubing. For example: `roundTypeId`,
`wcif_id`, `registrant_id`, `competition_event`, `skipped`.

- Don't invent a synonym for a term which is already well-established within the codebase and the community.
- Conversely, don't overload a term that already means something else
  - `results` as a general term for "something returned by an API call" should be `queryResults`,
    because *results* means something very specific at the WCA.
  - Exception for React frontend: `Event` subclasses for `onClick` and similar listeners can still be
    called `event` or `evt` as a callback parameter when writing event handlers.

### 2.4 Be internally consistent

Within one PR, one file, or one API payload: pick a convention and hold it.

- Not `competitors_x` in one field and `x_competitors` in the next.
- Not `snake_case` keys in one method and `camelCase` in a sibling method producing the same shape.
- If a method is called `orderResults`, the resulting variable is called `ordered`, and not `sorted`.
- If you rename a concept, rename the related variables (`rolesLoading`, `rolesError`, `rolesSync`),
  not just the one line you were looking at.

### 2.5 Booleans read as assertions, not commands

Boolean flags that indicate whether something is on or off, or whether something was enabled or not,
should generally use the English language "he/she/it" case, including the `-s` grammar suffix:
- `useWcaRegistration` reads as an instruction — "use the WCA registration!"
- `usesWcaRegistration` reads as the question to the answer "does it use WCA registration?"

Name the value behind a condition according to what makes it true, not after what you intend to do with the result:
- When a registration update is received, and the backend checks whether the request payload was sent
  by the same user that the registration is for (as opposed to an admin updating someone else's registration),
  then the variable should be named based on `isSelfUpdating` (or similar).
- If you later decide whether an email notification about the update should be sent based on this self-updating
  flag, you can name the parameter to the email sendout method as `shouldSendEmail`. But at the callsite, the
  variable you pass into that method should still be called `isSelfUpdating` as explained previously.

If one flag is quietly carrying two questions — "is this competition on the WCA registration system?"
*and* "does it already have registrations stored?" — that's two flags. Pass both and let the consumer
branch on the combination, including to warn/error about the case where the truth values are conflicting.

---

## 3. Ruby and Rails

→ **[`style/rails.md`](style/rails.md)**

**Read it when:** you are working on the backend in any `.rb` files, or reviewing a diff that touches there.
This is the case for many folder directories in our repo, because it was historically started as a Rails app.
`/app`, `/lib`, `/config` and even a few top-level files all contain Ruby backend code.

---

## 4. Database and migrations

- Column naming: booleans use an `is_` / `has_` prefix (MySQL can't take Rails' `?` suffix). Match
  the conventions of sibling tables — if `total_delegated` has no suffix, don't add one adjacent columns
  like `total_organized`.
- Use `after:` to place new columns sensibly. `schema.rb` sorts alphabetically in the developer dump,
  but the production table doesn't, and humans read it in PMA.
- Declare indexes inside `create_table` (`t.index %i[a b], unique: true`) or with `index: true` on
  the column, rather than as a separate statement.
- Let Rails infer foreign key columns and table names when they follow convention. `t.references`
  takes `type:` and `index:`; use `foreign_key: { to_table: ... }` only when inference fails.
- Wrap necessary data backfills in `up_only do ... end`. In general, data migrations should be Rake tasks
  (see [Rails guide](style/rails.md#10-jobs-and-rake-tasks)) but exceptions can be made if data *must* be there
  immediately upon executing the migration.
- Don't set arbitrary `limit:` on strings without a reason. We should rather strive to remove existing `limit`s
  than arbitrarily mimicking them, because more often than not they are tech debt from ye olden days.
- For a state machine with a natural order, use an integer-backed enum
  (`enum :lifecycle_state, [:pending, :open, :locked, :done]`) — the numbering encodes the progression.
- The `version` at the top of `schema.rb` must match the migration you're adding. A mismatch means
  you committed a stale schema.
  - Exception: If you are merging/rebasing your PR to the tip of `main`, somebody else
    might have merged another migration file with a newer timestamp
  - In case of doubt during merge conflicts: The `version` stamp should *always* represent the newest timestamp
    among all migration files in the `migrate` folder.
- When deleting columns (because you've established a newer format, or they are genuinely not needed anymore)
  always follow a two-step process **in two separate deployments**:
  1. Write a migration that adds the new column(s). Migrate the data (most likely via Rake task) and migrate
     the code to work with the new column(s). Treat the database as if the old column didn't exist anymore,
     but DO NOT physically delete it
  2. After you have **fully deployed** the first migration, and you are confident that the code is working well
     and all legacy data has been fully migrated: Open a second, **separate** PR that migrates the physical deletion

---

## 5. API design

The OpenAPI YAML under `next-frontend/openapi/` is the **single source of truth** for payload shapes.

Our API from v1 and onwards fully commits to `snake_case`. Even in frontend (TypeScript), access these fields
in their snake case notation. This makes it very clear which fields/properties of an object are fetched data
and which are genuinely newly computed within the frontend logic.

- Field naming rules from [§2.4](#24-be-internally-consistent) apply doubly here. Pick one
  prefix/suffix convention across a schema family.
- Move shared fields up into the base schema instead of repeating them in every descendant.
- Model variants with a `discriminator` on a single enum rather than a bag of mutually-dependent
  booleans. A `lifecycle_state` string beats `is_open` + `is_locked` + `is_clearable` + `is_openable`.
- Omitting a field from `required` already makes it nullable via `undefined` — don't also mark it `nullable`.
- Don't serialize fields "just in case". Extra serialized properties are cheap to add, invisible to
  find, and expensive on the database. If you add one temporarily, comment that it's temporary.
- Return arrays as arrays. Don't join error messages with `", "` on the backend — the frontend can
  do that if it really, really has to (but a bullet list by looping over the messages would be preferable).
- An endpoint must return the same shape regardless of who calls it. "Admins get extra keys" is a
  documentation (and nullability) nightmare; make a separate endpoint.
- Error responses should carry a meaningful, *specific* body. A bare 401 tells the frontend nothing —
  return a distinguishable JSON payload so the client can react to *this* 401 rather than any 401.
- Keep per-competition data out of per-round endpoints and vice versa. Put a property at the level it
  logically belongs to. If you need to cross-reference a competition within results, use its ID and nothing else.
- Don't silently drop parts of a payload. If a request carries fields the endpoint won't apply,
  choose deliberately between rejecting it with a 4XX and documenting that the field is ignored.
  Answering `200 OK` to a change you didn't make is not an option.
- Design for concurrency. At a large competition, requests interleave — prefer transactional payloads
  ("advance competitor #123, while verifying they are actually the next eligible one") over stateful booleans
  ("advance the next competitor").

---

## 6. Next.js frontend

→ **[`style/nextjs-frontend.md`](style/nextjs-frontend.md)**

**Read it when:** you are working on the new frontend under the `/next-frontend` folder.

---

## 7. Chakra UI and styling

Chakra v3 is the design system. We fully embrace the framework, which has one important consequence:
**Absolutely zero** hand-written CSS.

### 7.1 Mobile first

Design for the smallest screen first and widen from there. Competitors read this site on a phone, in
a venue, on bad WiFi — that's the common case, not the edge case. Retrofitting a desktop layout to
mobile afterwards is where our layout bugs come from, so treat mobile as a starting constraint rather
than a polish step.

- Write responsive props smallest-first: `w={{ base: "full", md: "50%" }}`. Never a fixed desktop
  value with a mobile override bolted on after review.
- **Never leave `base` unspecified** in a responsive prop — it's the case most of our users get.
- Prefer components that reflow on their own (`SimpleGrid` with `columnCount`, `Stack` that
  switches direction) over breakpoint branching that you need to maintain by hand.
- Look at a narrow viewport before you open the PR. Tables, dialogs and toolbars are the usual
  casualties.

### 7.2 Style props and the theme, not raw CSS

#### No `style={{ ... }}`.

Nearly everything has a Chakra prop equivalent — `fontWeight`, `position`, `w`, `h`. Use it.

#### No hex colours or ad-hoc palettes in components

Colours belong in `src/theme.ts`, referenced through `colorPalette` and semantic tokens
(`bg`, `colorPalette.border`). If a set of styles varies by a known set of values,
define a **recipe variant** in the theme and select it by value.

#### No arbitrary numbers

Use tokens (`sm`, `xl`, `2xl`, `full`) over `44`, `100%`, `w="100%"`.

### Use `textStyle`

We define `h1`–`h3`, `s1`, `s2` already, please use them rather than picking font sizes and weights by hand.

Don't force `textTransform` when the `textStyle` already decides it. If really necessary, make a good case for
introducing a new shared `textStyle` in `theme.ts`.

#### Other
- In our own theme you don't need Chakra's `--var` indirection — pass the palette colour directly.
- Chakra ships `fade-in` / `fade-out` keyframes and animation style props out of the box. Check
  before writing custom keyframes or a self-toggling boolean.

### 7.3 Use the component that exists

Before hand-rolling layout, check Chakra for: `SimpleGrid` (with optional `column-span`), `Stack`/`HStack`
(with `justifyContent="space-between"` instead of a `Spacer`), `List`, `Table.ColumnGroup`, `Float`,
`Status`, `Pagination`, `LinkOverlay`, `StatGroup`, `CheckboxGroup`.

- A mapped list of `Text` elements is a code smell — wrap it in the component that says what it is.
- Use `asChild` to merge wrappers instead of nesting redundant DOM nodes.
- Use compound dot-notation consistently (`Popover.Trigger`, not an imported `PopoverTrigger`).
- Prefer the component's own `disabled` prop over simulating a disabled look with color overrides.
- Use the responsive shorthands where they fit: `mdOnly`, `hideBelow`, `hideFrom` (see
  [§7.1](#71-mobile-first) for the `base`-first rule itself).
- Don't apply a fix at a lower level than the problem. Changing `IconDisplay` to constrain every icon
  everywhere, or teaching `Markdown.tsx` a global `maxWidth`, is too blunt — fix it at the call site
  or add a prop that can be passed down.

---

## 8. Legacy React (Webpacker / Semantic UI)

→ **[`style/legacy-frontend.md`](style/legacy-frontend.md)**

**Read it when:** you are creating or editing any `.jsx` / `.js` file under `app/webpacker/`, or
reviewing a diff that touches one. Its rules are the *opposite* of §6–§7 in places — most of all,
`useCallback` / `useMemo` are required there and forbidden in `next-frontend/`.

---

## 9. Tests

→ **[`style/tests.md`](style/tests.md)**

**Read it when:** you are adding or changing a test or a factory — RSpec under `spec/`, Vitest in
`next-frontend/`, Playwright in `system-tests/`.

---

## 10. i18n and user-facing copy

- All user-facing strings are translatable. This includes button labels, empty states, and error
  messages in new admin UIs.
- **Interpolate variables, not words.** `"Version %{n}"` must include the word "Version" in the
  translatable string — otherwise translators can't localise it.
- Reuse existing keys where one fits. Skim before adding.
- Write for non-native English speakers. Dense, expert-written copy (especially in emails) is a
  recurring review rejection. If a WRT/WST insider wrote the text, simplify it.
- **Status labels are not action labels.** A backend status `locked_for_posting` means it *is*
  locked; the button that gets you there says "Lock for posting". Don't reuse one string for both.
- Don't leak internal state names into copy. "Move to none" is the enum talking; the user reads
  "Remove from waitlist". "0 spots" is a number; the user reads "no spots left".
- Match the escaping conventions of the strings around you — we write quotes as `&quot;` in `en.yml`.
- Watch singular/plural agreement between the API and the UI, and use proper punctuation characters
  (`…`, not `...`).

Introducing new public vocabulary, or copy for an unreleased feature, needs agreement outside the PR —
see [CONTRIBUTING.md §5](CONTRIBUTING.md#5-changes-that-need-more-than-a-reviewer).
