# Weblate

Self-hosted [Weblate](https://weblate.org/) — the translation frontend for
`config/locales/*.yml` and Payload CMS content.

It is a separate compose project (`wca-weblate`) with its own network and
volumes, so it can run alongside the main stack. [Deployment](#deployment) is at
the bottom of this file.

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
- `edit_template: false` so translators can't edit English.
- `file_format` must be `ruby-yaml`

## Payload CMS content
- uses Weblate's local VCS (`vcs: local`, `repo: local:`) and sync over the REST API

```
Payload (MongoDB)  ──push source──▶  Weblate  ──translators work here
       ▲                                │
       └────────pull translations───────┘
```

`runSync` is both directions at once, and it runs from two places:

- An `afterChange` hook on every collection and global
- `scripts/weblate-sync.ts`, which can be triggered manually

```bash
cd next-frontend
yarn payload run scripts/weblate-sync.ts dry-run   # report, touch nothing
yarn payload run scripts/weblate-sync.ts seed      # first run
yarn payload run scripts/weblate-sync.ts           # afterwards
```

- `seed` uploads translations that already exist in Payload before pulling. It is
a one-time migration step.
- `WEBLATE_TOKEN`: a Weblate API token, from `/accounts/profile/#api` stored in Vault via `docker-entrypoint.sh`)

### Design decisions worth knowing:
- **Rich text is split into one unit per text node**, a rich
text field is written only when every one of its text nodes is translated.
- **A document is written only when all its required strings are translated.**
- `file_format` is flat `json`
- **Six locale codes need remapping**, since Weblate has its own language
database: `es-ES` is plain `es`, `zh-CN`/`zh-TW` are script-based
(`zh_Hans`/`zh_Hant`), and `es-419`, `fr-CA`, `pt-BR` use underscores. The map
is `WEBLATE_LANGUAGE_CODES` in `weblate.ts`.

---

## Deployment

A single on-demand EC2 instance running [`docker-compose.prod.yml`](docker-compose.prod.yml),
behind the existing `wca-on-rails` ALB on `translate.worldcubeassociation.org`,
created with plain AWS CLI commands.

### Why Docker Compose on one instance
- **Upstream ships Compose as the supported install.** Weblate's documented
deployment is the `weblate/weblate` image beside Postgres and Redis, configured
entirely through `WEBLATE_*` environment variables: `docker-compose.prod.yml` is
that file with our values.
- **Weblate is single-writer and stateful, so there is no scaling to buy.** The web
process, the Celery workers and beat all share `/app/data`: the git checkout of
`worldcubeassociation.org`, per-component VCS state, keys and uploads.
- **One volume means one backup.**, no need to keep RDS and data back ups in sync

### Before you start

**1. Push the branch.** The instance clones `weblate/` from GitHub.

**2. Register a production OAuth application** at
<https://www.worldcubeassociation.org/oauth/applications/new>:

| Field | Value |
|---|---|
| Name | `Weblate` |
| Redirect URI | `https://translate.worldcubeassociation.org/accounts/complete/oidc/` |
| Scopes | `openid profile email public translations` |
| Confidential | yes |

### Add Secrets in SSM

`render-env.sh` reads all seven and refuses to boot if any is missing or empty,
so put placeholders in for SES or GitHub push rather than leaving them out.

```bash
aws ssm put-parameter --type SecureString --name /weblate/oidc_key          --value '<client id from step 2 above>'
aws ssm put-parameter --type SecureString --name /weblate/oidc_secret       --value '<client secret>'
aws ssm put-parameter --type SecureString --name /weblate/postgres_password --value "$(openssl rand -base64 32)"
aws ssm put-parameter --type SecureString --name /weblate/admin_password    --value "$(openssl rand -base64 32)"
aws ssm put-parameter --type SecureString --name /weblate/github_token      --value 'unused-for-now'
aws ssm put-parameter --type SecureString --name /weblate/smtp_user         --value 'unused-for-now'
aws ssm put-parameter --type SecureString --name /weblate/smtp_password     --value 'unused-for-now'

# Keep the admin password — it is your way back in if SSO misbehaves.
aws ssm get-parameter --name /weblate/admin_password --with-decryption \
  --query 'Parameter.Value' --output text
```
### Launching the instance

The bootstrap is [`user-data.sh`](user-data.sh).

First boot pulls ~1 GB of images and runs Weblate's migrations — allow about
five minutes before it answers on `/healthz/`.

### Seeding the projects
On the instance, as root
```bash
/opt/wca/weblate/seed.sh          # Rails locales, from GitHub
/opt/wca/weblate/seed-payload.sh  # Payload CMS component
```

Log in at `https://translate.worldcubeassociation.org/` with a **WCA account**;
confirm the Weblate username is the numeric WCA user id (that is
`USERNAME_KEY=sub` working) and that the display name came through.
Only after a real WCA login has worked, consider setting `WEBLATE_NO_EMAIL_AUTH=1`.

### Translator permissions

- Translators get exactly the languages they hold a WCA translator role
for. The WCA OIDC provider carries one claim under the `translations` scope.

- The claim is consumed by a pipeline step, `customize/wca.py`, which `docker-compose.prod.yml` mounts at
`/app/data/python/customize/` and `settings-override.py` is mounted alongside and requests the scope and appends the step.

- Create the team the step assigns, in *Manage → Access*:

| | |
|---|---|
| Name | `WCA Translators` (must match `TEAM_NAME` in `customize/wca.py`) |
| Role | *Translate*, or *Power user* |
| Projects | the WCA project |
| Language selection | **All languages** — the per-member limit does the narrowing |

- **The pipeline runs only at login**, so a WCA role change takes effect at that
  user's next sign-in.
