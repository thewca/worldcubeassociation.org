# WCA Codebase Style Guide

This guide captures the conventions that WCA maintainers actually apply in code review. It was
derived from ~1,800 review comments on this repository, so every rule here is something that has
been asked for repeatedly on real pull requests. It is current through review comments up to
2026-08-24.

**Scope:** this guide covers things a linter *cannot* catch. RuboCop (`.rubocop.yml`), ESLint
(`next-frontend/eslint.config.mjs`) and Prettier are the source of truth for formatting and for
mechanical rules — run them before pushing and don't argue with them here.

**How to read it:** rules are stated as imperatives. Each one has a short *why*, because a rule you
understand is a rule you can apply to a case this document didn't anticipate.

---

## Table of contents

1. [Universal principles](#1-universal-principles)
2. [Naming](#2-naming)
3. [Ruby and Rails](#3-ruby-and-rails)
4. [Database and migrations](#4-database-and-migrations)
5. [API design](#5-api-design)
6. [Next.js frontend](#6-nextjs-frontend)
7. [Chakra UI and styling](#7-chakra-ui-and-styling)
8. [Legacy React (Webpacker / Semantic UI)](#8-legacy-react-webpacker--semantic-ui)
9. [Tests](#9-tests)
10. [i18n and user-facing copy](#10-i18n-and-user-facing-copy)
11. [Pull request hygiene](#11-pull-request-hygiene)

---

## 1. Universal principles

### 1.1 Every changed line must trace to the stated purpose of the PR

Unrelated diff is the single most common review complaint. It hides the real change and makes
`git blame` useless.

- Don't rename variables, reformat, or "improve" adjacent code you happen to be touching.
- Don't shorten `result` to `r` (or lengthen it) mid-refactor — the diff noise costs more than the
  readability gain.
- If a generated file (`src/types/openapi.ts`, `importMap.js`, `yarn.lock`, `schema.rb`) shows
  changes you didn't intend, delete and regenerate it, or merge `main` first. If the noise persists
  on `main`, push a separate hotfix PR that *only* fixes the generated file.
- Tooling config (`.eslintrc.json`, `.rubocop.yml`) counts as unrelated too. Improvements there are
  welcome, but as their own PR — a lint-rule change buried in a feature diff will be asked out.
- Notice unrelated dead code? Mention it in a comment. Don't delete it in this PR.

### 1.2 Extract on the second occurrence, not the first

Two rules pulling in opposite directions, both enforced:

- **Don't extract single-use things.** A variable or helper function referenced exactly once should
  be inlined at its point of use. Reviewers will `CTRL+F` for the second usage; if it isn't there,
  they will ask why the indirection exists.
- **Do extract on repetition.** The moment a snippet appears two or three times — a `setQueryData`
  updater, a "name + registrant ID in brackets" string, a "given an old ticket, update this field"
  block — it becomes a helper. This applies within a file *and* across files.

### 1.3 Prefer immutable operations

In-place mutation is treated as a defect unless justified in a comment.

| Don't | Do |
| --- | --- |
| `array.sort(...)` | `array.toSorted(...)` |
| `map.set(k, v)` in a `forEach` | build a new object via spread / `Object.fromEntries` |
| `array.pop()`, `arr.tap(&:pop)` | `take_while` / `drop_while` / slicing |
| `let x = ...` then reassign in a loop | build a new collection with `map` / `reduce` |

In JavaScript, `let` is itself the smell: it tells the reader "something below reassigns this", and
reviewers will ask for a `const` built from a `map`, a `reduce`, or a ternary. Mutating an object you
were handed is a last-resort exception and has to be argued for in the PR — assume your PR isn't one.

If you genuinely must recompute values in place, produce *new* entries rather than mutating existing
ones.

### 1.4 No magic values

Every literal that isn't self-evidently meaningful gets a name.

- Backend: a module-level or class-level constant. Even for values that are "obviously 2 today" —
  derive them (`linked_round.rounds.size`) so the code survives a Regulations change.
- Frontend: a design token (`fontSize="2xl"`, `w="full"`) or a named `const`. Raw `44`, `1`, `#3B82F6`
  will be questioned.
- If a constant comes from an external protocol (an AnyCable message key, a keyboard code), document
  where it comes from in a comment next to the declaration.

### 1.5 Comment the *why*, not the *what*

Code comments are required when:

- You worked around a library bug or quirk (`initialData` type inference through `api.queryOptions`,
  Redocly `allOf` handling, the `use client` directive needed for icon functions).
- Your code depends on non-obvious ordering, indexing, or a business rule (e.g. filtering after a
  `map` because you need the original index).
- You ported logic from another codebase (WCA Live, a Ruby equivalent) — say so and name the source.

Comments are *not* wanted for things a reader can infer, and code that says "delete this when X
happens" is usually noise: if the code will naturally become unnecessary, it doesn't need a note.

### 1.6 Don't paper over errors

- `try`/`catch` (or `rescue`) around something that "sometimes explodes" is not acceptable. Find out
  *what* throws and prevent that input from reaching the call.
- Don't null-guard defensively (`?.`, `&.`, `!`, `?? 0`) without knowing which case you're guarding.
  If you can't name the case, the guard is hiding a bug — or it's dead code.
- If you branch on format ("if it parses as JSON do X, else treat it as CSV"), validate the else
  branch too and return a real error when it's neither.
- A `rescue` inside a method body is rejected. In a controller, catch the exception at the top with
  `rescue_from` (`rescue_from JSON::Schema::ValidationError`) — the happy path stays readable and
  every action gets the same handling.
- Don't swallow failed writes. See [3.4](#34-bang-methods-and-failed-writes).

### 1.7 Reuse existing code before writing new code

Before introducing a helper, search for one. Core results logic in particular must live in exactly
one place so that a bug fix fixes every caller. Concretely, the codebase already has:
`SolveTime` parsers, `ScheduleActivity.parse_activity_code`, `Registrations::Lanes::Competing`,
`RegistrationChecker#apply_payload`, `Competition.wcif_json_schema`,
`Competition.validate_wcif_schema!`, `useInputState`, `fetchJsonOrError`, `routes.js.erb` link
helpers, the OpenAPI error component. Ask before re-implementing any of them — in particular, don't
call a validation library directly when a model method already wraps it.

The same goes for the libraries we depend on. Before hand-coding something commonplace — a character
limit on an editor, a debounce, a flag icon — read that package's documentation and check whether
it's already a prop or an option. Reviewers will ask whether you looked.

---

## 2. Naming

### 2.1 Names describe what something *means*, not how it was computed

`hash` → `state_hash` or `round_checksum`. `Errored` → `OpenapiError`. `last_event` that returns an
ID → either return the event or rename to `last_event_id`.

### 2.2 Shape must match the name

- A `*ByX` suffix means it's a map keyed by X. If it's an array, rename it or turn it into a map.
- `statMap` should be an object, not an array you `find!` through.
- Singular method name, plural arguments → pick one.
- `withResults` reads as "definitely has results". If you mean "a tuple of competitor and result",
  say so.

### 2.3 Use established WCA vocabulary

`roundTypeId`, `wcif_id`, `registrant_id`, `competition_event`, `skipped`. Don't invent a synonym for
a term the codebase and the community already use. Conversely, don't overload a term that already
means something else — "results" in a Tanstack context should be `queryResults`, because *results*
means something very specific at the WCA.

### 2.4 Be internally consistent

Within one PR, one file, or one API payload: pick a convention and hold it.

- Not `competitors_x` in one field and `y_competitors` in the next.
- Not `snake_case` keys in one method and `camelCase` in a sibling method producing the same shape.
- If a method is `orderResults`, the variable is `ordered` — not `sorted`.
- If you rename a concept, rename the related variables (`rolesLoading`, `rolesError`, `rolesSync`),
  not just the one line you were looking at.

### 2.5 Booleans read as assertions, not commands

`useWcaRegistration` reads as an instruction — "use WCA registration!". `usesWcaRegistration` reads as
the question the flag actually answers. Name the value behind a condition after what makes it true
(`self_updating = request[:user_id] == authenticated_user.id`), not after what you intend to do about
it.

If one flag is quietly carrying two questions — "is this competition on the WCA registration system?"
*and* "does it already have registrations stored?" — that's two flags. Pass both and let the UI
branch on the combination, including to warn about the case where both are true.

### 2.6 Ruby-specific naming

- Boolean methods end in `?`. Drop `should_` / `is_` prefixes — the `?` carries that meaning.
- Methods that mutate or can raise end in `!` (a method calling `insert_all!` should be
  `load_live_results!`).
- Serializers get a `to_` prefix, matching `to_json`.
- Prefer `delegate :url, to: :competition, prefix: true, allow_nil: true` over a hand-written
  forwarding `def`.
- Use `prefix: true` on `delegate` when the bare name would be misleading on the receiving model.
- Name users by their role, not by Devise defaults: `locking_user`, `quitting_user` — not `user`.

---

## 3. Ruby and Rails

### 3.1 Reach for the Rails idiom

You are expected to know these. Reviewers will suggest them by name:

| Instead of | Use |
| --- | --- |
| nested `[]` with `&.` | `hash.dig(:a, :b)` |
| `[x].flatten` / manual array check | `Array.wrap(x)` |
| a manual `each` building a lookup | `index_by`, `group_by`, `transform_values` |
| `map { ... }.compact` | `filter_map` |
| `select` on an AR relation in Ruby | `filter` (avoids confusion with SQL `SELECT`) |
| `find_or_create_by` under concurrency | `create_or_find_by` (catches the unique-constraint race) |
| `params.require(...).permit(...)` | `params.expect(...)` (Rails 8) |
| a hand-rolled forwarding method | `delegate` |
| `x.respond_to?(:m) ? x.m : x` | `x.try(:m) \|\| x` — `try` has the check baked in |
| `(a + b).uniq` | `a \| b` (array set union) |
| `unless x.nil?` on a column | `x?` — Rails generates `column?` as `column.present?` |
| a block param named `|x|` used once | `it` |
| `Time.now` inside a model | `self.current_time_from_proper_timezone` |

`belongs_to` implies `presence: true` since Rails 5 — don't add a redundant validation.

### 3.2 Query performance is reviewed, always

- **Never fire a query inside a loop.** `exists?` per row, `Registration.find(...)` per row,
  `Model.count` per row — all rejected. `pluck` the ids once and compare in memory, or `includes`.
- **`size` vs `count` vs `length`:** `count` always issues `SELECT COUNT(*)`. `length` always loads
  the full relation into memory. `size` does the right thing depending on whether the association is
  already loaded. Default to `size`.
- **`to_a` defeats `includes`.** Once you force a relation into an array you've lost lazy evaluation
  and preloading. Only do it deliberately.
- Prefer `pluck(:id)` / `.ids` over loading models when you only need identifiers.
- Push work into SQL where it's cheap: `.distinct` before `pluck`, `maximum(:col)` (returns `nil`
  cleanly on an empty set) instead of `any?` + `maximum`, `.or(...)` for SQL `OR`.
- **Don't load a record just to ask whether it exists.** Hydrating a whole `Country` to use it as a
  boolean is backwards: `pluck` the ids once and intersect the sets, or use `exists?` — outside a loop.
- Chain in the order a reader would expect: apply the scope and the preloads first, *then* the
  terminal call (`Competition.with_preloads.search(...)`). Code that only works in the other order is
  usually relying on an accident.
- Use `find_each` for large batches.
- Counter caches (`counter_cache: true`) beat nested `COUNT` subqueries. Rails infers the column name
  from the association.

### 3.3 Model associations over hand-rolled queries

If you're writing a query that walks from one model to another, it probably wants to be an
association — associations can be `includes`d, they give you `_ids` helpers for free, and they can
carry a default scope.

```ruby
has_many :colinked_rounds, ->(rd) { where.not(id: rd.id) }, through: :linked_round, source: :rounds
has_many :colinked_results, through: :colinked_rounds, source: :live_results
has_many :competitions, -> { distinct }, through: :rounds
```

- Put ordering in the association scope (`-> { order(:number) }`) rather than at each call site.
- Add `-> { distinct }` when joining through a many-to-many.
- Use a `scope` for any `where` clause you write twice. Scopes are for *filtering* — never put
  side effects or non-query logic in one.
- Set collection membership through the generated `_ids=` writer
  (`self.competition_scoretaker_ids = new_ids`). Rails diffs the old and new sets and issues exactly
  the inserts and deletes needed; a hand-written "delete all, then re-add" does more work and loses
  the callbacks.
- Rails `has_many` associations expose `after_add` / `after_remove` callbacks on the parent. Use them
  instead of calling `reload` from a child's callback — `reload` inside a hook is a red flag.

### 3.4 Bang methods and failed writes

`update`, `create`, `save`, `update_columns` return a boolean and **fail silently**. Either check the
return value and act on it, or use the `!` variant so a failure raises.

This applies in application code, in rake tasks, and in tests. In a test, a silently-failed `update`
means you're asserting against data you never actually wrote.

Related: don't send an email and *then* persist the state change. Confirm the write succeeded first.

### 3.5 `delete_all` vs `destroy_all`

- `delete_all` — one SQL statement, fast, **skips** validations, callbacks, and `dependent:` options.
- `destroy_all` — one `DELETE` per row, slow, respects your model layer.

Choose deliberately and say why in review. For a single record you almost always want `destroy`.
Reach for `delete_all` only for bulk operations where the model layer genuinely has nothing to do.

Prefer `dependent: :destroy` / `dependent: :delete_all` on the association over manually cascading
deletes in a migration or job. Note that `dependent:` on a `belongs_to` is unorthodox — put it on the
`has_many` / `has_one` side.

### 3.6 Polymorphism over type checks

`while` loops with `is_a?` checks to walk a polymorphic hierarchy are rejected. Define the same
method on each possible class (returning an empty array where it doesn't apply) and let dispatch do
the work. Where a method may legitimately be missing, `try(:page_title)` with a sensible default is
an acceptable compromise.

### 3.7 Transactions

Any operation that issues multiple dependent writes — `destroy_all` followed by `insert_all`,
quitting several competitors, opening a round while locking the previous one — belongs in a
transaction. You can call `transaction` on an instance (`self.transaction do`), not just on the class.

For "do this only after the transaction commits", see Rails' per-transaction callbacks.

### 3.8 Controllers

- Guard clauses belong in `before_action`. Rails halts the chain when a `before_action` renders or
  redirects. Declare the `before_action` immediately above the action it protects so the reader sees
  it; if that's impossible, leave a comment pointing at it.
- Prefer `return render status: ..., json: { error: ... } if condition` — inline `.present?` checks
  are the established pattern in this codebase.
- Handle errors through the shared machinery: `rescue_from WcaExceptions::ApiException` and friends.
  Don't invent a per-controller error shape.
- After a mutation, return the entity you changed — not the whole collection re-serialized.
- **The controller owns input validation.** Clamping, range checks, and 4XX responses for nonsense
  values belong where the request payload is parsed. A model method asked to calculate with a negative
  amount should calculate with a negative amount — don't make every caller pay for one caller's bad
  input.
- Serialize via the model's `*_SERIALIZE_OPTIONS` constants; combine them with set union
  (`User::DEFAULT_SERIALIZE_OPTIONS[:only] | %w[unconfirmed_wca_id]`) rather than restating the list.
  Pass those options to `as_json` instead of hand-writing a `map` that builds hashes.

### 3.9 Jobs and rake tasks

- Job class names end in `Job`. "Run" is implied — `AllSanityChecksJob`, not `RunAllSanityChecks`.
- ActiveJob serializes ActiveRecord models for you (it stores the ID and re-finds on execution) and
  handles multiple positional args. Pass the model, or pass the ID — don't pass redundant extra
  fields the job can look up itself.
- Put the primary entity first in the argument list, then the values being applied to it.
- **One-off data fixes are rake tasks, not migrations.** Put them in `lib/tasks/` and have a WST
  senior member run them after deploy. Migrations are for schema.

### 3.10 Put procedural logic in `lib/`, not in a model

A model is for a record and its behaviour. A multi-step procedure — importing results, computing
dues, reconciling an uploaded file — belongs in a module under `lib/` (`CompetitionResultsImport`,
`DuesCalculator`, `FinishUnfinishedPersons`). Look for an existing module that is the right home
before adding another one.

For the same reason, be slow to introduce a new ActiveRecord model. If a feature has worked for years
without its own table, be ready to say what changed that now requires one.

---

## 4. Database and migrations

- Column naming: booleans use an `is_` / `has_` prefix (MySQL can't take Rails' `?` suffix). Match
  the conventions of sibling tables — if `total_delegated` has no suffix, don't add one to the column
  next to it.
- Use `after:` to place new columns sensibly. `schema.rb` sorts alphabetically, but the production
  table doesn't, and humans read it in PMA.
- Declare indexes inside `create_table` (`t.index %i[a b], unique: true`) or with `index: true` on
  the column, rather than as a separate statement.
- Let Rails infer foreign key columns and table names when they follow convention. `t.references`
  takes `type:` and `index:`; use `foreign_key: { to_table: ... }` only when inference fails.
- Wrap data backfills in `up_only do ... end`.
- Don't set arbitrary `limit:` on strings without a reason.
- For a state machine with a natural order, use an integer-backed enum
  (`enum :lifecycle_state, [:pending, :open, :locked, :done]`) — the numbering encodes the progression.
- The `version` at the top of `schema.rb` must match the migration you're adding. A mismatch means
  you committed a stale schema.

---

## 5. API design

The OpenAPI YAML under `next-frontend/openapi/` is the **single source of truth** for payload shapes.

- Field naming rules from [§2.4](#24-be-internally-consistent) apply doubly here. Pick one
  prefix/suffix convention across a schema family.
- Move shared fields up into the base schema instead of repeating them in every descendant.
- Model variants with a `discriminator` on a single enum rather than a bag of mutually-dependent
  booleans. A `lifecycle_state` string beats `open` + `locked` + `clearable` + `openable`.
- Omitting a field from `required` already makes it nullable — don't also mark it `nullable`.
- Don't serialize fields "just in case". Extra serialized properties are cheap to add, invisible to
  find, and expensive on the database. If you add one temporarily, comment that it's temporary.
- Return arrays as arrays. Don't join error messages with `", "` on the backend — the frontend can
  render a bullet list if you give it a list.
- An endpoint must return the same shape regardless of who calls it. "Admins get extra keys" is a
  documentation nightmare; make a separate endpoint.
- Error responses should carry a meaningful, *specific* body. A bare 401 tells the frontend nothing —
  return a distinguishable JSON payload so the client can react to *this* 401 rather than any 401.
- Keep per-competition data out of per-round endpoints and vice versa. Put a property at the level it
  logically belongs to.
- Don't silently drop parts of a payload. If a request carries fields the endpoint won't apply,
  choose deliberately between rejecting it with a 4XX and documenting that the field is ignored.
  Answering `200 OK` to a change you didn't make is the one option that isn't on the table.
- Design for concurrency. At a large competition, requests interleave — prefer transactional payloads
  ("advance competitor #123, and verify they're still the eligible one") over stateful booleans
  ("advance the next one").

---

## 6. Next.js frontend

### 6.1 Server components by default

If a page or component can be an `async` server component, it must be. Fetching the Auth.js session,
computing derived values, and awaiting API calls all work server-side.

When one interactive widget forces client rendering (a dropdown, a toggle), extract *that widget*
into its own `"use client"` component and leave the rest of the tree server-rendered. Don't mark a
whole page as client because of a single control.

Where you must use `"use client"` for a non-obvious reason (e.g. passing icon functions from server
to client throws a hard error under Next 16), say so in a comment.

### 6.2 Types come from the schema

Never hand-declare a type that describes API data. Derive it:

```ts
type StatColumns = Pick<components["schemas"]["LiveResult"], "best" | "average" | "global_pos">;
```

Use `Pick`, `Partial`, and `Omit` on the generated OpenAPI types so a spec refactor breaks the build
instead of silently drifting. The same applies to Payload types — regenerate them
(`yarn types:payload`) rather than editing `src/types/payload.ts`.

- **No `as` casts.** If you need one, the type is wrong somewhere — say what you tried in the PR.
- **No `!` non-null assertions.** Restructure so the value can't be undefined (hoist the lookup
  above an early return; React Compiler means you no longer need `useCallback`, so the
  "hooks before early return" constraint is looser than you think).
- Prefer `undefined` over `null` for optional values, and let `useState<number>()` infer.
- Use library-provided types (`TFunction` from i18next, Next's `instrumentation` types) instead of
  writing your own structural equivalents. Spend five minutes in the library's source before
  declaring a 20-line interface.
- Type a wrapper from the component it wraps: intersect your own props with
  `ComponentPropsWithoutRef<typeof Icon>` so the wrapper accepts everything the wrapped component
  does. Anything built through Chakra's `createIcon` takes `Icon`'s props.
- Pass real types across props. A boolean prop receives `true`, not `"true"`.
- Use `as const` for lookup objects that should narrow.

### 6.3 React Compiler is enabled — delete your memos

`useMemo` and `useCallback` in `next-frontend/` are redundant and will be flagged. (This does **not**
apply to `app/webpacker/` — see [§8](#8-legacy-react-webpacker--semantic-ui).)

### 6.4 Data fetching with Tanstack Query

- Pull `api.queryOptions(...)` once and spread it, rather than nesting `useQuery` calls — `api.useQuery`
  is itself a thin wrapper around `useQuery`.
- **Don't use `enabled: false`** to freeze a query into a dumb prop container. If you have the data
  already, pass `initialData`. Reshape with `select` if the shape doesn't match.
- Let the query client hold the state. `queryClient.setQueryData(key, (old) => next(old))` supports
  updater functions exactly like `useState` — use it instead of mirroring server state into React
  state and manually syncing the two.
- `setQueryData` on a key that doesn't exist is a no-op, so you rarely need to check for presence first.
- `isPending` is only true for the *initial* fetch. Use `isFetching` if you care about refetches and
  invalidations.
- If you just refetched, don't also patch the cache by hand — the refetch already brought the truth.
- Prefer `setQueryData` from a mutation's response over `invalidateQueries` when the server already
  told you the new state; it saves a round trip.
- Don't fetch data incidentally deep in a helper "because it's cached anyway". Fetch it explicitly
  where it's needed, so the next developer can find and reuse it.
- Keep `lazyMount` on dialogs, tabs, and accordions. Without it every panel's queries fire on page
  load — including the "list every Delegate region in the database" request behind a tab the user
  never opened.
- Give toasts stable IDs to prevent duplicates across re-renders.

### 6.5 Component structure

- **Nothing complex inside JSX.** Inline arrow callbacks are fine only for trivial one-liners
  (`onClick={() => setOpen(true)}`) and boolean comparisons. Anything with an `if`, a `map` that
  reshapes data, or more than one statement moves to a named const in the component preamble.
- **Nothing complex inside `if (...)` either.** Assign the call's result to a named variable and test
  the variable — the name is what tells the next reader what the condition means.
- Extract a dialog or a repeated block into its own component file once it's more than incidental.
- Prefer `children` over a `text?: string | ReactNode` prop with `typeof` checks. `children` handles
  strings natively.
- Put context providers as high in the tree as they can reasonably go. A provider that toasts should
  render its own `Toaster` rather than requiring consumers to remember one.
- Be consistent about how a context is consumed: either every child reads it internally, or every
  child receives props. Don't mix within one feature.
- `useEffect` is for synchronising with systems outside React (a websocket, a timer) and should
  return a cleanup function. Anything else needs justification. `useLayoutEffect` needs a very good
  justification — there's essentially one in the entire codebase.
- Wrap `useEffectEvent` inside the hook that owns the effect. Per the React docs, Effect Events must
  never be passed to other components or hooks.
- Use Luxon `DateTime`, not JS `Date` — FullCalendar drives this choice.
- Parse dates before sorting them. Never sort date strings with `localeCompare`.
- Icons come from our own pack or Lucide. Don't introduce a new react-icons family.
- Everything user-visible goes through i18n. Server components use `const { t } = await getT();`.

---

## 7. Chakra UI and styling

Chakra v3 is the design system. The recurring review theme is: *use the framework, don't fight it.*

### 7.1 Style props and the theme, not raw CSS

- **No `style={{ ... }}`.** Nearly everything has a Chakra prop equivalent — `fontWeight`,
  `position`, `w`, `h`. Use it.
- **No hex colours or ad-hoc palettes in components.** Colours belong in `src/theme.ts`, referenced
  through `colorPalette` and semantic tokens (`bg`, `.border`). If a set of styles varies by a
  known set of values, define a **recipe variant** in the theme and select it by value.
- **No arbitrary numbers.** Use tokens (`sm`, `xl`, `2xl`, `full`) over `44`, `100%`, `w="100%"`.
- Use `textStyle` (we define `h1`–`h3`, `s1`, `s2`) rather than picking font sizes and weights by hand.
  Don't force `textTransform` when the `textStyle` already decides it.
- In our own theme you don't need Chakra's `--var` indirection — pass the palette colour directly.
- Chakra ships `fade-in` / `fade-out` keyframes and animation style props out of the box. Check
  before writing custom keyframes or a self-toggling boolean.

### 7.2 Use the component that exists

Before hand-rolling layout, check Chakra for: `SimpleGrid` (with `column-span`), `Stack`/`HStack`
(with `justifyContent="space-between"` instead of a `Spacer`), `List`, `Table.ColumnGroup`, `Float`,
`Status`, `Pagination`, `LinkOverlay`, `StatGroup`, `CheckboxGroup`.

- A mapped list of `Text` elements is a smell — wrap it in the component that says what it is.
- Use `asChild` to merge wrappers instead of nesting redundant DOM nodes.
- Use compound dot-notation consistently (`Popover.Trigger`, not an imported `PopoverTrigger`).
- Prefer the component's own `disabled` prop over simulating a disabled look with colour overrides.
- Use responsive shorthands: `base` for the smallest breakpoint (never under-specify it), `mdOnly`,
  `hideBelow`.
- Don't apply a fix at a lower level than the problem. Changing `IconDisplay` to constrain every icon
  everywhere, or teaching `Markdown.tsx` a global `maxWidth`, is too blunt — fix it at the call site
  or add a prop.

---

## 8. Legacy React (Webpacker / Semantic UI)

`app/webpacker/` is on Semantic UI and **has no React Compiler**. Rules differ from `next-frontend/`.

- You *do* need `useCallback` / `useMemo` here to keep references stable.
- **No custom CSS here either.** No `style={{ marginBottom: ... }}`, no `className`s that SemUI
  doesn't define — the framework has props for spacing and layout. The one researched exception is
  horizontal table overflow (`overflowX`), which SemUI genuinely doesn't support.
- Use Semantic UI dot-notation (`Table.Header`, `Table.HeaderCell`) — it removes a pile of imports.
- Use our own hooks: `useInputState` / `useInputUpdater` wrap `useState` so the setter can be passed
  straight to a SemUI `Input`'s `onChange`. `useLoadedData` returns response `headers`, which carry
  total-count information for pagination (see `IncidentsLog/index.jsx`).
- Use `fetchJsonOrError` as-is. It has error handling built into its name; don't wrap it in your own.
- Build URLs with the helpers in `lib/requests/routes.js.erb` (`competitionUrl(...)`), not string
  concatenation.
- `mutationFn` must not close over component state. Pass the values in as parameters — it keeps
  renders stable.
- `useMutation` has `onError` alongside `onSuccess`. Use it rather than hand-rolling error handling.
- Beware `onSuccess` argument shadowing: `onSuccess={setSuccess}` passes the *server response* as the
  new state. Write `() => setSuccess(true)` if that's what you mean.
- Use `Message` components for user-facing errors — not bare `className`s that don't exist in SemUI.
- Prefer early returns for loading states (`if (isFetching) return <Loader />`) so `data` is
  implicitly defined afterwards, then a ternary for the empty-vs-populated case.
- Use `<Ref>` when you need to attach a ref to a SemUI component that doesn't forward one. Don't add
  a wrapper `<div>` to hold the ref, and don't hand-roll a replacement for a component we already
  have — wrap the existing one.

---

## 9. Tests

- **Never delete a test without a replacement.** This will block a PR on its own.
- Test data must be *visibly* invalid. If a "duplicate results" test creates two results for the same
  round, that isn't inherently wrong — a real round has hundreds. Make explicit what makes the
  fixture a duplicate, rather than relying on an implementation detail of a factory.
- Use values that make the assertion obvious (`100, 200, 300, 400, 500` rather than repeated `100`s
  that muddle "duplicate attempt" with "duplicate result").
- Test both edges. "Wrong number of results" needs a too-few *and* a too-many case. If a check has a
  regional dimension, assert the positive cases too, not just the negative one.
- If the test title says "within the whole competition", the test must cover cross-round cases.
- Use `update!` in tests. A silent `false` from `update` invalidates everything downstream.
- Factories:
  - Prefer `association :user_with_wca_id` over `FactoryBot.create(...)` inside factory attributes.
    Direct `create`/`build` calls belong in `after_build` / `after_create` hooks only.
  - Create the object in its final state instead of creating and then immediately updating it.
  - Use existing traits (`create(:competition, :with_delegate)`) instead of assembling by hand.
- Use `let!` when you need the block to run eagerly; it's the clean version of a `before` block.
- Consider RSpec shared examples instead of looping with `each` over cases.
- Hard-coded English strings in tests are fine, even when the code under test is localised.
- `expect { ... }.to raise_error(SomeError) do |err| ... end` lets you assert on the error object.
- Keep spec code boring. If a reviewer has to ask what a piece of notation does and why it was
  necessary, write it out plainly instead.
- Seed data belongs in `db/seeds`, not in the spec.

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
- Don't advertise features that aren't publicly released yet.
- When introducing new terminology to competitors ("locked", "Dual Rounds"), get community/WCT/WQAC
  input before it lands in `en.yml` — don't invent public vocabulary in a PR.

---

## 11. Pull request hygiene

- **Respond to every review comment.** Resolving a thread without a code change *and* without a reply
  is the fastest way to stall a PR. Marking a thread resolved is not the same as addressing it: if you
  left the concern untouched, say so and say why. If you disagree, say why.
- Unresolved `TODO`s in the diff need a decision: either fix it in this PR or say explicitly that
  it's a note for later.
- Keep PRs scoped. "Seems best not to do too much in one PR" — split refactors from features, and
  split a hotfix to a shared generated file into its own PR.
- If your description and your diff disagree ("comment-only fix" that changes display logic), the
  reviewer will trust the diff and ask. Keep the description accurate.
- If a file move wasn't detected as a rename, leave a comment on the diff saying where it came from.
- Merge `main` to clear unrelated changes from your diff.
- Explain non-obvious decisions proactively. "If it doesn't work out, explain in two or three
  sentences why this is the cleanest code you could come up with" is an accepted answer — silence
  is not.
- If you used an LLM to produce a solution, you still own it: be able to justify why it's the right
  approach.
