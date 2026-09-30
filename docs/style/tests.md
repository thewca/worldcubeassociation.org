# Tests

**Applies to:** any test or factory you add or change — RSpec with FactoryBot under `spec/`, Vitest
in `next-frontend/`, Playwright in `system-tests/`.

- **Never delete a test without a replacement**. If a test case really doesn't make sense anymore
  (for whatever reason; this is hardly ever the case) justify it in a review comment or your PR description.
- Test data must be *visibly* invalid. If a "duplicate results" test creates two results for the same
  round, that isn't inherently wrong — a real round has hundreds of results. Make explicit what makes the
  fixture a duplicate, rather than relying on an implementation detail of a factory.
- Use values that make the assertion obvious (`100, 200, 300, 400, 500` rather than repeated `100`s
  that muddle "duplicate attempt" with "duplicate result").
- Test both edges:
  - "Wrong number of results" needs a too-few *and* a too-many case.
  - If a check has a regional dimension, assert the positive cases too, not just the negative one.
- If the test title says "within the whole competition", the test must actually cover the whole competition
  and not just cherry-pick one specific competitor of one specific round.
- Use `update!` in Rails/RSpec tests. A silent `false` from `update`
  invalidates every test assumption downstream.
- Factories:
  - Prefer `association :user_with_wca_id` over `FactoryBot.create(...)` inside factory attributes.
    Direct `create`/`build` calls belong in `after_build` / `after_create` hooks only.
    - Note: There are legacy uses of `create()` inside factory attributes. These are technical debt
      from long ago, and should be changed whenever there is a chance. Do not copy them as a "role model" example!
  - Create the object in its final state instead of creating and then immediately updating it.
  - Use existing traits (`create(:competition, :with_delegate)`) instead of assembling by hand.
- Hard-coded English strings in tests are fine, even when the original code under test is localized.
- Use `let!` when you need the block to run eagerly; it's the concise version of a `before` block.
- Strongly consider RSpec shared examples instead of looping with `each` over cases.
- `expect { ... }.to raise_error(SomeError) do |err| ... end` lets you assert on the error object.
- Keep spec code boring. Tests are not the place for showing off your intricate Ruby skills. If your test
  actually _needs_ complex Rails idioms (in most cases, even a `filter_map` is almost too much!)
  then seriously consider chunking it down into separate test cases.
- Seed data (which goes beyond "create a competition that starts on this-and-that hardcoded date,
  with these-and-those hardcoded events") belongs in `db/seeds`, not in the spec.
