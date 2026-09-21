# Weblate

Self-hosted [Weblate](https://weblate.org/) — the translation frontend for
`config/locales/*.yml` and Payload CMS content.

Deploying it: [DEPLOYMENT.md](DEPLOYMENT.md).

It is a separate compose project (`wca-weblate`) with its own network and
volumes, so it can run alongside the main stack.

## Run it locally

```bash
docker compose -f weblate/docker-compose.yml up -d
./weblate/seed.sh            # Rails locales
./weblate/seed-payload.sh    # Payload CMS content
```

<http://localhost:8080/projects/wca/>, log in as **admin / admin**. First boot
takes a few minutes (migrations + search index); `seed.sh` waits for it.

```bash
docker compose -f weblate/docker-compose.yml down -v   # tear down, incl. data
```

`seed.sh` clones `github.com/thewca/worldcubeassociation.org` (~450 MB). The
repo root is mounted read-only at `/wca-repo`, so you can use your working copy
instead — faster, but Weblate then can't push back, so it is the wrong setup for
testing the PR flow:

```bash
REPO=file:///wca-repo BRANCH=$(git branch --show-current) ./weblate/seed.sh
```

## Rails locales

Rails i18n YAML is monolingual — every file carries the full key set, `en.yml`
is the base — which maps onto `ruby-yaml` with `template: config/locales/en.yml`
and `edit_template: false` so translators can't edit English.

**`file_format` must be `ruby-yaml`.** Plain `yaml` round-trips the files
losslessly but is broken here: Rails locale files are rooted at the locale code,
so it produces keys like `de->about->x`, none of which match the template — 0 of
2303 — and every language reports 0% translated. Stripping the root key is the
whole point of `ruby-yaml`. Do not "fix" this.

`config/locales/` holds 43 `.yml` files but only 33 are locales. The rest
(`faker.en.yml`, `shared.en.yml`, `devise_overrieds.ru.yml`,
`time_will_tell.*.yml`) carry a dotted prefix and Weblate's default language
filter `^[^.]+$` already excludes exactly those — the discovered set is an exact
match for `lib/static_data/available_locales.json`, with no hand-maintained
exclusion list. `time_will_tell` becomes a second component over the same clone
(`repo: weblate://wca/locales`) rather than a second checkout.

## Payload CMS content

Payload stores content in MongoDB, so there is no repository to point Weblate
at. The component uses Weblate's local VCS (`vcs: local`, `repo: local:`) and
strings move over the REST API:

```
Payload (MongoDB)  ──push source──▶  Weblate  ──translators work here
       ▲                                │
       └────────pull translations───────┘
```

`runSync` is both directions at once, and it runs from two places:

- **An `afterChange` hook** on every collection and global (`withWeblateSync` in
  `payload.config.ts`). It fires only for writes in the source locale, so the
  sync's own write-backs cannot retrigger it, and an `inFlight` guard collapses
  a burst of edits into one run. It is deliberately not awaited — Weblate being
  slow or down must not fail an editor's save.
- **`scripts/weblate-sync.ts`, on a schedule.** The hook cannot see work
  finished in Weblate while nobody edits Payload, which is most of it.

```bash
cd next-frontend
yarn payload run scripts/weblate-sync.ts dry-run   # report, touch nothing
yarn payload run scripts/weblate-sync.ts seed      # first run
yarn payload run scripts/weblate-sync.ts           # afterwards
```

Arguments are positional, not `--flags`: `payload run` parses argv with minimist
and passes only the positional remainder through, so a flag is silently
swallowed.

`seed` uploads translations that already exist in Payload before pulling. It is
a one-time migration step: routine syncs never push translations upward, because
that would overwrite newer translator work with whatever Payload happens to
hold.

Configuration is environment only — `WEBLATE_URL` and `WEBLATE_TOKEN` (a Weblate
API token, from `/accounts/profile/#api`; in deployed environments it comes out
of Vault via `docker-entrypoint.sh`), plus optional `WEBLATE_PROJECT` and
`WEBLATE_COMPONENT` that default to `wca`/`payload`. **With no `WEBLATE_TOKEN`
the hook is a no-op** and the script refuses to run, so a developer without a
Weblate instance is unaffected. `seed-payload.sh` prints the token for the local
instance.

Design decisions worth knowing:

**There is no translation UI in the app.** Weblate is the only place
translators work, which is the point of adopting it.

**Rich text is split into one unit per text node**, keyed by its position in the
tree (`home:body#0.1.0`), so translators see plain sentences, never Lexical
JSON. On write-back the *source* document is deep-cloned and only `text` values
are substituted — structure, node versions and unknown node types come from
Payload itself, so a Payload or Lexical upgrade cannot corrupt a write. A rich
text field is written only when every one of its text nodes is translated; a
half-German paragraph reads worse than the English fallback.

**A document is written only when all its required strings are translated.**
Payload validates `required` per locale on write, so an untranslated required
field leaves three options: `null` (Payload rejects the document), the English
source (which then silently goes stale), or holding the document back. Only the
last keeps Payload's own fallback working, so an untranslated locale renders
English *now* rather than English from the last sync. Optional fields have no
such constraint and are cleared individually.

`file_format` is flat `json`, not `json-nested` — keys are dotted paths like
`home:blocks(TextCard)[abc].body#0.1.0` (globals) or `posts#64f2:…` (collection
documents, which carry the document id), and nested would split them on every
dot into a tree that no longer round-trips.

**Six locale codes need translating**, since Weblate has its own language
database: `es-ES` is plain `es`, `zh-CN`/`zh-TW` are script-based
(`zh_Hans`/`zh_Hant`), and `es-419`, `fr-CA`, `pt-BR` use underscores. The map
is `WEBLATE_LANGUAGE_CODES` in `weblate.ts`. Two traps if you extend it: the
code a component *reports* is not always the one its URL accepts
(`language_code_style: linux` displays `zh_Hans` as `zh_CN`, but only `zh_Hans`
resolves), and Weblate answers both "language already exists" and "never heard
of this language" with an identical 400, so `ensureLanguage` verifies by lookup
instead of trusting the response.

## Not configured here

- **Push back to GitHub.** Weblate commits into its own clone; PRs need the
  component's push URL plus a GitHub token (`WEBLATE_GITHUB_TOKEN`, and
  *Manage → Repository maintenance*). Test against a fork first — it is the only
  part that writes to the repo. Locales only; Payload writes back through the
  API.
- **WCA SSO locally.** The `WEBLATE_SOCIAL_AUTH_OIDC_*` block in `environment`
  is commented out; production has it on, and with it the `customize/wca.py`
  pipeline step that turns the WCA `translations` claim into per-language
  permissions (DEPLOYMENT.md step 9). Locally, grant yourself languages by hand.
- **A schedule for `scripts/weblate-sync.ts`.** The `afterChange` hook covers
  Payload edits; nothing yet covers translations finished in Weblate while
  Payload sits idle.

Weblate wants ~3 GB RAM on its own. `WEBLATE_WORKERS=2` in `environment` keeps
it modest, but watch it alongside the full WCA stack.
