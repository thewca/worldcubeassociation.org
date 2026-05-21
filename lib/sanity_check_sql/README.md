# Sanity Check SQL Queries

Sanity checks are SQL queries that run automatically once a month against the live WCA database to detect irregularities. Results are emailed to the relevant WCA team (usually WRT). They only run on the live site, not staging.

## Directory structure

Each folder corresponds to a category, named `<category_id> - <category_snake_case_name>/`. Each SQL file inside corresponds to one check, named `<check_id> - <query_file>.sql`.

```
lib/sanity_check_sql/
  <category_id> - <category_name>/
    <check_id> - <query_file>.sql
```

Categories and checks are defined in:
- `lib/static_data/sanity_check_categories.json` — category definitions (`id`, `name`, `email_to`)
- `lib/static_data/sanity_checks.json` — check definitions (`id`, `sanity_check_category_id`, `topic`, `query_file`, `comments`)

Both use `StaticData` — no ActiveRecord migrations are needed when adding categories or checks.

## Writing queries

Queries run against the **application database**, not just the public export, so they have access to `rounds`, `competition_events`, `users`, `registrations`, etc. in addition to the core results tables.

The **v2 schema** (snake_case) is used: `persons`, `results`, `result_attempts`, `competitions`, etc.

Attempt values are stored in the `result_attempts` table (not `value1`–`value5`). Time values are in centiseconds; `-1` = DNF, `-2` = DNS.

Cutoff and time limit data is stored as JSON in `rounds.cutoff` and `rounds.time_limit`, extracted with `JSON_EXTRACT`.

### Style conventions

All queries should follow these conventions to keep the codebase consistent and readable.

**Formatting:**
- SQL keywords in **uppercase** (`SELECT`, `FROM`, `WHERE`, `JOIN`, `AND`, `OR`, `AS`, `DISTINCT`, `NOT IN`, `IS NULL`, etc.)
- Each major clause starts on its **own line**: `SELECT`, `FROM`, `WHERE`, `JOIN`, `ON`, `GROUP BY`, `HAVING`, `ORDER BY`, `WITH`
- `JOIN` and `ON` are **not indented** (same level as `FROM`)
- `AND`/`OR` conditions are indented **2 spaces** relative to the clause keyword (`WHERE`, `HAVING`, `ON`)
- When a `SELECT` has **multiple targets**, each goes on its own line indented 2 spaces, with `SELECT` alone on its line ([SQLFluff layout.select_targets](https://docs.sqlfluff.com/en/stable/reference/rules.html#rule-layout.select_targets)); a single target stays on the same line as `SELECT`
- Inside a **CTE body**, the same rules apply with 2-space indentation
- Always end the file with a **semicolon**
- Use `--` for comments, not `#`

**Naming:**
- All aliases (columns, tables, CTEs) must be **snake_case**

**Query design:**
- Prefer **CTEs** (`WITH ...`) over inline subqueries in `FROM` or `JOIN` clauses; use LEFT JOIN anti-joins instead of `NOT IN (SELECT ...)`
- Avoid `SELECT *` — name the columns you need so the result email is self-explanatory

### What the query should return

Each returned row represents one problem instance. Include enough columns to identify it — at minimum a WCA ID or competition ID, plus whatever context helps the fixer understand and act on it.

Results must be **deterministic**. If using aggregations like `GROUP_CONCAT`, always specify an `ORDER BY` inside the function (e.g. `GROUP_CONCAT(x ORDER BY x)`). Non-deterministic output means the same logical result can produce different row values across runs, causing exclusions to silently fail to match.

## Adding a new check

### 1. Choose a category

Pick from `lib/static_data/sanity_check_categories.json`. If none fits, append a new entry with a new `id`, `name`, and `email_to`.

### 2. Add an entry to `sanity_checks.json`

```json
{
  "id": "71",
  "sanity_check_category_id": "<category_id>",
  "topic": "Short description of what is being checked",
  "comments": null,
  "query_file": "descriptive_name.sql"
}
```

### 3. Create the SQL file

Place it at `lib/sanity_check_sql/<category_id> - <category_snake_case>/<check_id> - <query_file>`.

Example for a new check with ID 71 in category 1:

```
lib/sanity_check_sql/1 - person_data_irregularities/71 - descriptive_name.sql
```

### 4. Test the query

Run it directly against your local developer database. Use the same database Rails connects to in development. The query is read and executed via:

```ruby
Rails.root.join("lib", "sanity_check_sql", category.folder_handle, check.file_handle).read
```

where `file_handle = "#{id} - #{query_file}"` and `folder_handle = "#{id} - #{snake_case_name}"`.

## Suppressing false positives (exclusions)

Known false positives can be suppressed with `SanityCheckExclusion` records. These are managed through the admin UI at `/admin/sanity_check` — each result row has an "Add exclusion" button that stores the row as JSON. No manual database work is needed to add exclusions.

Matching is partial: an exclusion suppresses a result row if all fields in the exclusion hash match the corresponding fields in the query result. This means an exclusion can be intentionally broad (e.g. matching only on `wca_id`) to suppress all future results for a given person.

Removing exclusions has no UI — it requires direct database access.
