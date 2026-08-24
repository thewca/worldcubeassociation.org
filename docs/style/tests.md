# Tests

Part of the [WCA style guide](../STYLE_GUIDE.md). Read this before writing or changing specs.

Rails uses RSpec with FactoryBot (`spec/factories/`); `next-frontend/` uses Vitest; end-to-end tests
are Playwright under `system-tests/`.

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
