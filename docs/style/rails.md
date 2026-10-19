# Ruby and Rails

**Applies to:** the backend in any `.rb` files, or reviews of a diff that touches there.
This is the case for many folder directories in our repo, because it was historically started as a Rails app.
`/app`, `/lib`, `/config` and even a few top-level files all contain Ruby backend code.

## 1 Ruby-specific naming

**Ruby uses `snake_case` throughout.**

- Methods returning a boolean end in `?`. Drop `should_` / `is_` / `can_` / `has_`
  prefixes — the `?` carries that meaning.
- Methods that mutate in-place or can raise end in `!`. This rule propagates if you're writing
  a custom method which is calling a `!` method (a method to load Live Results, which is calling
  `insert_all!` internally should be called `load_live_results!`).
- Serializers get a `to_` prefix, matching `to_json`.
- Use `prefix: true` on `delegate` when the bare name would be misleading on the receiving model.
- Name users by their role/ purpose, not by Devise defaults: `locking_user`, `quitting_user` — not simply `user`.

The general naming rules in [§2](../STYLE_GUIDE#2-naming) apply on top of these.

## 2 Idiomatic programming

Ruby has **a lot** of idioms, and especially the Rails framework doubles down on this philosophy.
Ruby code should generally read as "fluent" as possible. If you need more lines of control flow
than you need to express actual, meaningful business logic computations, you should probably look out
for an idiomatic syntax or helper method.

Common examples include, but are not limited to: (feel free to add to this list when you learn something cool!)

| Instead of                             | Actually use                                             |
|----------------------------------------|----------------------------------------------------------|
| nested `[]` with `&.`: `foo[:a]&.[:b]` | `hash.dig(:a, :b)`                                       |
| `[x].flatten` / manual array check     | `Array.wrap(x)`                                          |
| a manual `each` building a lookup      | `index_by`, `group_by`, `transform_values`               |
| `map { ... }.compact`                  | `filter_map`                                             |
| `select` on an AR relation in Ruby     | `filter` (avoids confusion with SQL `SELECT`)            |
| `find_or_create_by` under concurrency  | `create_or_find_by` (catches the unique-constraint race) |
| `params.require(...).permit(...)`      | `params.expect(...)` (Rails 8)                           |
| a hand-rolled forwarding method        | `delegate`                                               |
| `x.respond_to?(:m) ? x.m : x`          | `x.try(:m) \|\| x` — `try` has the check baked in        |
| `(a + b).uniq`                         | `a \| b` (array set union)                               |
| `unless x.nil?` on a column            | `x?` — Rails generates `column?` as `column.present?`    |
| a single block param named `x`         | `it`                                                     |
| `Time.now` inside a model              | `self.current_time_from_proper_timezone`                 |
| `SomeModel.select(:foo).map(&:foo)`    | `SomeModel.pluck(:foo)`                                  |

If you explore the Ruby codebase and you see some method that you don't know at all what it does,
take a moment to read the docs and learn about it!

### Dynamic typing gotchas

If you're coming from JavaScript or another dynamically typed language, there are two things to keep in mind:
1. Ruby supports "sloppy" `if` evaluation: Anything non-`nil` will typically evaluate as `true`.
   We try to stay consistent and readable by using `if foo.present?` as an idiom whenever you want to do such checks.
2. Ruby has both `foo = "string"` and `bar = :symbol` as data types. But note that `foo !== bar`, so pay attention!
   The interpreter does **not** auto-cast symbols into strings, which can be a trap especially for accessing dicts/maps.

## 3 Query performance

Due to the size and user count of our app, we greatly value query performance. This is especially true
when…
- Fetching registrations data (all tables related to `registrations` are under load when a comp opens,
  which nowadays happens almost daily across the world)
- Computing results lists / rankings / records. The `results` table is _huge_, so everything you do there
  needs to be backed by an index or highly performant SQL queries.

### Never fire a query inside a loop

- `exists?` per row
- `Registration.find(...)` per user in a loop
- `SomeModel.count` per entry in a list of models

→ `pluck` the ids once and compare in memory, or `includes`.

### `size` vs `count` vs `length`

- `count` always issues `SELECT COUNT(*)`
- `length` always loads the query results into memory and counts them as an array
- `size` does the right thing depending on whether the association is already loaded

→ Default to `size`, unless you have a specific reason not to.

### `to_a` skips over later `includes`

Once you force a relation into an array you've lost all further lazy evaluation and preloading.
Only do it when you're sure about what you're doing.

- Prefer `pluck(:id)` / `.ids` over loading models when you only need identifiers.
- Push work into SQL where it's cheap:
  - `.distinct` before `pluck(...)` so you don't need `.uniq` in Rails
  - `maximum(:col)` (returns `nil` cleanly on an empty set) instead of `any?` + `maximum`
  - `.or(...)` for SQL `OR` (this can model surprisingly complex relations!)

### Don't load a record just to ask whether it exists.
Hydrating a whole `Competition` only to use it as a pseudo-boolean (is it `nil` or something non-`nil`?)
is too expensive.

→ `pluck` the ids once and intersect the sets, or use `exists?` (outside a loop, of course).

### Other things to keep in mind

- Chain in the order a reader would expect: apply the scope and the preloads first, *then* the
  terminal call (`Competition.includes(:some, :preloading, :relations).search(...)`).
  Code that only works in the other order is usually relying on an accident.
- Use `find_each` for large batches.
- Counter caches (`counter_cache: true`) beat nested `COUNT` subqueries. Rails infers the column name
  from the association.

## 4 Model associations over hand-rolled queries

If you're writing a query that walks from one model to another, it probably wants to be an
association — associations can be `includes`d by other callers, they give you `*_ids` helpers for free,
and they can carry a default scope.

```ruby
# Base association: Any round can optionally be part of a linked round
belongs_to :linked_round, optional: true
# Clever associations derived from it, which can be reused
# instead of hand-rolling the same code snippet all over the place
has_many :colinked_rounds, ->(rd) { where.not(id: rd.id) }, through: :linked_round, source: :rounds
has_many :colinked_results, through: :colinked_rounds, source: :live_results

# Another example of how relations can give you convenience through their `-> {}` scope
has_many :competitions, -> { distinct }, through: :rounds
has_many :events, -> { order(:rank) }, through: :competition_events
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

## 5 Bang methods and failed writes

`update`, `create`, `save`, `update_columns` return a boolean and **fail silently**. Either check the
return value and act on it, or use the `!` variant so a failure raises.

This applies in application code, in rake tasks, and in tests. In a test, a silently-failed `update`
means you're asserting against data you never actually wrote.

Related: don't send an email and *then* persist the state change. Confirm the write succeeded first.

## 6 `delete_all` vs `destroy_all`

- `delete_all` — one SQL statement, fast, **skips** validations, callbacks, and `dependent:` options.
- `destroy_all` — one `DELETE` per row, slow, respects your model layer.

Choose deliberately and say why in review. For a single record you almost always want `destroy`.
Reach for `delete_all` only for bulk operations where the model layer genuinely has nothing to do.

Prefer `dependent: :destroy` / `dependent: :delete_all` on the association over manually cascading
deletes in a migration or job. Note that `dependent:` on a `belongs_to` is unorthodox — put it on the
`has_many` / `has_one` side.

## 7 Polymorphism over type checks

Loops or switch-cases with `is_a?` checks to walk a polymorphic hierarchy are generally rejected.
Define the same method on each possible class (returning an empty array where it doesn't apply)
and let normal method dispatch do the work.
You can think of this as pseudo-`interface` contracts from Java et al. ported to Ruby. Any polymorphic
class that _could potentially be_ instantiated in a given variable should "implement" a given interface,
ignoring the fact that Ruby has no formal mechanism of enforcing interfaces.

Where a method may legitimately be missing, `try(:cool_method)` with a sensible default
is considered an acceptable compromise.

## 8 Transactions

Any operation that issues multiple dependent writes — `destroy_all` followed by `insert_all`,
quitting several competitors, opening a round while locking the previous one — belongs in a
transaction. You can call `transaction` on an instance (`self.transaction do`), not just on the class.

For "do this only after the transaction commits", see Rails' per-transaction callbacks: `tx.before_commit`,
`tx.after_commit` and `tx.after_rollback`. This is especially useful for sending out emails or other forms of
notifications (websocket update packages etc.) only after all operations have concluded successfully.

## 9 Controllers

- Guard clauses belong in `before_action`
  - Rails halts the chain when a `before_action` renders or redirects.
  - Declare the `before_action` immediately above the action it protects so the reader sees it; if that's impossible, leave a comment pointing at it.
- Return early if something isn't right: `return render status: ..., json: { message: ... } if condition`
- Handle errors through the shared machinery: `rescue_from WcaExceptions::ApiException` and friends.
  Don't invent a per-controller error shape.
- After a mutation, return the entity that you changed with the (successful, confirmed) changes applied
- **The controller owns input validation.** Clamping, range checks, and 4XX responses for nonsense
  values belong where the request payload is parsed.
- Serialize via the model's `*_SERIALIZE_OPTIONS` constants; combine them with set union
  (`User::DEFAULT_SERIALIZE_OPTIONS[:only] | %w[unconfirmed_wca_id]`) rather than restating the list.
  Pass those options to `as_json` instead of hand-writing a `map` that builds hashes.

## 10 Jobs and Rake tasks

- Job class names end in `Job`. "Run" is implied — `AllSanityChecksJob`, not `RunAllSanityChecks`.
- ActiveJob serializes ActiveRecord models for you (it stores the primary key ID and re-finds on execution)
  and handles multiple positional args. Pass the model, or pass the ID — don't pass redundant extra
  fields the job can look up itself.
- Put the primary entity first in the argument list, then the values being applied to it.
- **One-off data fixes are rake tasks, not migrations.** Put them in `lib/tasks/` and have a WST
  senior member run them after deploy. Migrations are for schema and database structure, not database contents.

## 11 Put procedural logic in `lib/`, not in a model

A model is for a record and its behavior. A multi-step procedure — importing results, computing
dues, reconciling an uploaded file — belongs in a module under `lib/` (`CompetitionResultsImport`,
`DuesCalculator`, `FinishUnfinishedPersons`). Look for an existing module that is the right home
before adding another one.

For the same reason, be slow to introduce a new ActiveRecord model. If a feature has worked for years
without its own table, you need to justify why a new table is needed now, or what substantial benefits
the introduction of a new table holds.
