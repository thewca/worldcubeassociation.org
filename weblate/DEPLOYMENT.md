# Deploying Weblate

A single on-demand EC2 instance behind the existing `wca-on-rails` ALB on
`translate.worldcubeassociation.org`, created with plain AWS CLI commands — no
Terraform. Every ID below was read out of the WCA account, not guessed.

| | |
|---|---|
| ALB | `arn:aws:elasticloadbalancing:us-west-2:285938427530:loadbalancer/app/wca-on-rails/396a56d00f80f390` |
| ALB security group | `sg-04e3a30309aab1b1a` |
| VPC | `vpc-a19320c4` |
| ACM cert | `*.worldcubeassociation.org` (ISSUED) — covers the subdomain already |
| Route53 zone | `Z06972271NGRVXJI4XQPM` (public) |
| Free rule priority | **120** (in use: 20,30,33–36,40,50,60,70,80,90,100,110,1001,1002) |

Deliberate simplifications:

- **On-demand, not Spot.** ~$60/month for a t3.large. Spot saves ~$40 but only
  pays off with automated replacement, and translators should not have the
  instance vanish mid-session.
- **Public subnet with a public IP, not private.** Sidesteps confirming NAT
  egress from `us-west-2b`. The security group admits nothing but the load
  balancer, and SSM Session Manager works over outbound connections.
- **Data on the root volume**, 50 GB with `DeleteOnTermination=false` plus
  termination protection, instead of a separate EBS volume. Fewer moving parts;
  the volume still survives an accidental terminate.

---

## Before you start

**1. Push the branch.** The instance clones `weblate/` from GitHub. Use whatever
branch holds it.

**2. Register a production OAuth application** at
<https://www.worldcubeassociation.org/oauth/applications/new>:

| Field | Value |
|---|---|
| Name | `Weblate` |
| Redirect URI | `https://translate.worldcubeassociation.org/accounts/complete/oidc/` |
| Scopes | `openid profile email public translations` |
| Confidential | yes |

The trailing slash is required — Doorkeeper matches redirect URIs exactly.

`profile` is easy to leave off and produces a confusing failure.
python-social-auth requests `openid profile email` (its `DEFAULT_SCOPE`) plus
whatever `SOCIAL_AUTH_OIDC_SCOPE` adds, and Doorkeeper validates the lot against
the *application's* scope list — so a missing `profile` fails the authorize step
with "The requested scope is invalid, unknown, or malformed", which reads like a
Weblate misconfiguration but is the app registration. Staging's seeded
`example-application-id` carries every scope, which is why this never shows up
when testing against staging.

`translations` is what step 9 uses to assign translator languages. Leave it off
and every login fails the same way.

## 0. Shell variables

Shell-local: re-run this block if you open a new terminal partway through.

```bash
export AWS_PAGER=""
export AWS_REGION=us-west-2

BRANCH=main                             # the branch you pushed above
NAME=wca-weblate
DOMAIN=translate.worldcubeassociation.org

VPC=vpc-a19320c4
SUBNET=subnet-5475fd31                  # us-west-2a, auto-assigns a public IP
ALB_SG=sg-04e3a30309aab1b1a
ZONE=Z06972271NGRVXJI4XQPM

LISTENER=$(aws elbv2 describe-listeners \
  --load-balancer-arn "$(aws elbv2 describe-load-balancers --names wca-on-rails \
      --query 'LoadBalancers[0].LoadBalancerArn' --output text)" \
  --query 'Listeners[?Port==`443`].ListenerArn' --output text)

AMI=$(aws ssm get-parameter \
  --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --query 'Parameter.Value' --output text)

echo "listener=$LISTENER ami=$AMI"
```

## 1. Secrets in SSM

`render-env.sh` reads all seven and refuses to boot if any is missing or empty,
so a half-configured Weblate never starts. If you are not using SES or GitHub
push yet, put obvious placeholders in rather than leaving them out.

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

## 2. IAM role and instance profile

```bash
aws iam create-role --role-name $NAME --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

# Session Manager, so the instance needs no SSH key and no bastion.
aws iam attach-role-policy --role-name $NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

aws iam put-role-policy --role-name $NAME --policy-name weblate-secrets --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
      "Resource": "arn:aws:ssm:us-west-2:285938427530:parameter/weblate/*"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "*",
      "Condition": {"StringEquals": {"kms:ViaService": "ssm.us-west-2.amazonaws.com"}}
    }
  ]
}'

aws iam create-instance-profile --instance-profile-name $NAME
aws iam add-role-to-instance-profile --instance-profile-name $NAME --role-name $NAME

# IAM is eventually consistent; launching immediately often fails to attach.
sleep 15
```

## 3. Security group

```bash
SG=$(aws ec2 create-security-group --group-name $NAME \
  --description "Weblate: HTTP from the wca-on-rails load balancer only" \
  --vpc-id $VPC --query GroupId --output text)

# Source is the ALB's security group, not a CIDR — nothing else in the VPC, and
# nothing on the internet, can reach 8080 even though the instance has a public
# IP.
aws ec2 authorize-security-group-ingress --group-id $SG \
  --protocol tcp --port 8080 --source-group $ALB_SG

echo "sg=$SG"
```

## 4. Launch the instance

The bootstrap is [`user-data.sh`](user-data.sh); only the branch is substituted.

```bash
sed "s|@BRANCH@|$BRANCH|" weblate/user-data.sh > /tmp/weblate-user-data.sh
grep 'git clone' -A1 /tmp/weblate-user-data.sh    # confirm the branch landed

INSTANCE=$(aws ec2 run-instances \
  --image-id $AMI \
  --instance-type t3.large \
  --subnet-id $SUBNET \
  --security-group-ids $SG \
  --iam-instance-profile Name=$NAME \
  --associate-public-ip-address \
  --metadata-options "HttpTokens=required,HttpEndpoint=enabled" \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":50,"VolumeType":"gp3","DeleteOnTermination":false,"Encrypted":true}}]' \
  --disable-api-termination \
  --user-data file:///tmp/weblate-user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME},{Key=Service,Value=weblate}]" \
  --query 'Instances[0].InstanceId' --output text)

echo "instance=$INSTANCE"
aws ec2 wait instance-running --instance-ids $INSTANCE
```

First boot pulls ~1 GB of images and runs Weblate's migrations — allow about
five minutes before it answers on `/healthz/`.

## 5. Target group and listener rule

```bash
TG=$(aws elbv2 create-target-group --name $NAME \
  --protocol HTTP --port 8080 --vpc-id $VPC --target-type instance \
  --health-check-path /healthz/ \
  --health-check-interval-seconds 30 --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 --unhealthy-threshold-count 5 \
  --matcher HttpCode=200 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE

aws elbv2 create-rule --listener-arn $LISTENER --priority 120 \
  --conditions "[{\"Field\":\"host-header\",\"HostHeaderConfig\":{\"Values\":[\"$DOMAIN\"]}}]" \
  --actions "[{\"Type\":\"forward\",\"TargetGroupArn\":\"$TG\"}]"

echo "tg=$TG"
```

No certificate work: the listener already carries `*.worldcubeassociation.org`.

## 6. DNS

An alias A record rather than a CNAME — one less lookup, and no charge.

```bash
ALB_DNS=$(aws elbv2 describe-load-balancers --names wca-on-rails \
  --query 'LoadBalancers[0].DNSName' --output text)
ALB_ZONE=$(aws elbv2 describe-load-balancers --names wca-on-rails \
  --query 'LoadBalancers[0].CanonicalHostedZoneId' --output text)

aws route53 change-resource-record-sets --hosted-zone-id $ZONE --change-batch "{
  \"Changes\": [{
    \"Action\": \"UPSERT\",
    \"ResourceRecordSet\": {
      \"Name\": \"$DOMAIN\",
      \"Type\": \"A\",
      \"AliasTarget\": {
        \"HostedZoneId\": \"$ALB_ZONE\",
        \"DNSName\": \"$ALB_DNS\",
        \"EvaluateTargetHealth\": false
      }
    }
  }]
}"
```

## 7. Verify

```bash
# Target health — expect "healthy" within ~5 minutes of launch.
aws elbv2 describe-target-health --target-group-arn $TG \
  --query 'TargetHealthDescriptions[].TargetHealth' --output json

curl -sI "https://$DOMAIN/" | head -1

# On the box, if it does not come up
aws ssm start-session --target $INSTANCE
#   sudo tail -100 /var/log/cloud-init-output.log
#   sudo docker compose -f /opt/wca/weblate/docker-compose.prod.yml logs --tail 100
#   curl -s -o /dev/null -w '%{http_code}\n' -H "Host: $(hostname -i)" localhost:8080/healthz/
```

That last curl is the one to run if the target stays unhealthy while the
container looks fine — it reproduces exactly what the ALB health check sends,
and a `400` means `ALLOWED_HOSTS` did not pick up the private IP.

## 8. Seed the projects

```bash
aws ssm start-session --target $INSTANCE
# then, on the instance:
#   sudo /opt/wca/weblate/seed.sh          # Rails locales, from GitHub
#   sudo /opt/wca/weblate/seed-payload.sh  # Payload CMS component
```

Log in at `https://translate.worldcubeassociation.org/` with a **WCA account**;
confirm the Weblate username is the numeric WCA user id (that is
`USERNAME_KEY=sub` working) and that the display name came through. `admin` plus
the password from step 1 is the fallback. Only after a real WCA login has
worked, consider setting `WEBLATE_NO_EMAIL_AUTH=1`.

Before the first write back to `main`, read "Before the first write to `main`"
in [README.md](README.md) — the one-time reflow wants its own commit.

## 9. Translator permissions

Translators should get exactly the languages they hold a WCA translator role
for, without anyone maintaining that list twice.

The WCA OIDC provider has an optional `translations` scope carrying one claim:

```json
{ "translator_locales": ["ca", "de"] }
```

Those are the WCA locale codes the signed-in user has an **active** translator
role for (a `UserGroup` of type `translators`, with the locale on the group's
metadata). No role gives `[]`, not an absent claim, and it is emitted in both
the ID token and the userinfo response — so it arrives regardless of which
social-core version is in play. Verify it independently of Weblate with any
token scoped `openid translations`:

```bash
curl -H "Authorization: Bearer <token>" https://www.worldcubeassociation.org/oauth/userinfo
# => {"translator_locales":["ca"],"sub":"94007"}
```

**Weblate has no built-in claim-to-team mapping.** Its only no-code automatic
assignment is a regex on e-mail address, and nothing in
`weblate/accounts/pipeline.py` touches groups or claims. So the claim is
consumed by a pipeline step, `customize/wca.py`, which
`docker-compose.prod.yml` mounts at `/app/data/python/customize/` — a directory
Weblate has already installed as a Django application. `settings-override.py`
is mounted alongside it and requests the scope and appends the step; it is
`exec`'d inside the settings namespace, and neither setting is reachable through
a `WEBLATE_*` variable, which is the only reason both files exist.

Then create the team the step assigns, in *Manage → Access*:

| | |
|---|---|
| Name | `WCA Translators` (must match `TEAM_NAME` in `customize/wca.py`) |
| Role | *Translate*, or *Power user* |
| Projects | the WCA project |
| Language selection | **All languages** — the per-member limit does the narrowing |

`user.groups.add(team)` creates the membership row and `set_limit_languages`
narrows that one member to their own locales. Weblate's own warning applies:
once a member has a language limit, that team's project-wide, component-wide and
global permissions are not granted to them. That is what we want here.

**Set the project's access control to *Custom*.** Otherwise the default *Users*
team hands *Power user* to everyone on all languages and the per-member limits
buy nothing.

Two caveats:

- **The pipeline runs only at login**, so a translator role change on the WCA
  side takes effect at that user's next sign-in. If that is too slow, a periodic
  Celery task in `customize/tasks.py` polling the WCA API is the follow-up.
- **Weblate documents its internal API as unstable across releases**, so
  `TeamMembership` and `set_limit_languages` want re-checking on every upgrade.

References: Weblate [authentication](https://docs.weblate.org/en/latest/admin/auth.html)
and [access control](https://docs.weblate.org/en/latest/admin/access.html),
[`settings_docker.py`](https://github.com/WeblateOrg/weblate/blob/main/weblate/settings_docker.py),
[python-social-auth OIDC backend](https://python-social-auth.readthedocs.io/en/latest/backends/oidc.html).

---

## Production settings that bite

All of these are already in `environment.prod.template`; this is why they are
there.

**`WEBLATE_SECURE_PROXY_SSL_HEADER` is not optional once `ENABLE_HTTPS` is on.**
`ENABLE_HTTPS` switches on Django's `SECURE_SSL_REDIRECT`
(`settings_docker.py:1143`) but leaves `SECURE_PROXY_SSL_HEADER` unset unless
this variable is supplied (`settings_docker.py:1214`). Django then treats the
ALB's plain-HTTP forward as insecure and 301s to `https://`, which the ALB
terminates and forwards as HTTP again — an infinite loop that looks like
`"GET / HTTP/1.1" 301 5` repeating in the container log.

**`WEBLATE_IP_PROXY_HEADER`** — without it every request appears to come from
the ALB's private IP. Weblate's brute-force protection then counts all users as
one client, so a handful of failed logins rate-limits *everyone*.

**`WEBLATE_ALLOWED_HOSTS` must include the private IP.** ALB health checks send
`Host: <target-ip>:8080`, not the public hostname. Django validates `Host`
before any view runs and returns **400** on a mismatch — including for
`/healthz/`. The target never goes healthy, the ALB serves 503, and the
application logs look completely normal. `user-data.sh` reads the IP from IMDS
and passes it to `render-env.sh` as `WEBLATE_PRIVATE_IP`.

**Images are pinned to exact tags** in `docker-compose.prod.yml`
(`weblate/weblate:2026.8`, `postgres:18-alpine`). Weblate uses CalVer and
requires sequential upgrades across major versions — you cannot jump from 2026.8
to 2027.5 in one step, and a floating tag will eventually destroy the database
on some unattended pull. A major Postgres bump needs an explicit `pg_upgrade` or
dump/restore.

**Email** goes through SES (`WEBLATE_EMAIL_*`). The `From` address must be a
verified SES identity, and the account needs to be out of the sandbox to mail
arbitrary translators. Without it, nobody gets notifications.

## Operations

**Backups.** Set up an AWS Backup / DLM policy with daily snapshots and ~30-day
retention. Weblate also has built-in BorgBackup that can target S3 — worth
enabling as a second, application-consistent layer, since a snapshot of a
running Postgres is crash-consistent rather than clean. Test a restore once
before relying on either. **Do this on day one**: a translator losing a month of
work is the failure that would kill adoption.

**Upgrades.** Bump the pinned tag, `docker compose pull`, restart. Never skip a
major version. Snapshot first; the container runs migrations on start and there
is no down-migration.

**Logs.** `docker compose logs` on the box only. Shipping to CloudWatch means
adding the agent; skip it until something needs debugging remotely.

## Accepted risks

- **No HA and no automatic recovery.** An instance failure is a manual rebuild:
  re-run step 4 and re-register the target. The root volume survives, so the
  data does.
- **Restarts are downtime**, and they drop translator sessions since Postgres
  runs on the same box. Do upgrades outside a translation push.
- **Postgres is on the instance.** Cheaper and simpler than RDS, but backup
  correctness is your problem rather than AWS's. RDS is the obvious upgrade if
  Weblate becomes load-bearing.
- **One volume is the single point of data loss.** Termination protection and
  `DeleteOnTermination=false` guard the obvious mistakes; nothing guards a
  missing snapshot policy.
- **Payload pulls translations back only on a Payload edit.** The `afterChange`
  hook covers edits; work finished in Weblate while Payload sits idle needs
  `yarn payload run scripts/weblate-sync.ts`, which is not yet scheduled.

## Teardown

In this order — the rule and target group cannot be deleted while in use.

```bash
RULE=$(aws elbv2 describe-rules --listener-arn $LISTENER \
  --query "Rules[?Priority=='120'].RuleArn" --output text)
aws elbv2 delete-rule --rule-arn $RULE
aws elbv2 delete-target-group --target-group-arn $TG

aws route53 change-resource-record-sets --hosted-zone-id $ZONE --change-batch "{
  \"Changes\": [{\"Action\": \"DELETE\", \"ResourceRecordSet\": {
    \"Name\": \"$DOMAIN\", \"Type\": \"A\",
    \"AliasTarget\": {\"HostedZoneId\": \"$ALB_ZONE\", \"DNSName\": \"$ALB_DNS\",
                      \"EvaluateTargetHealth\": false}}}]
}"

aws ec2 modify-instance-attribute --instance-id $INSTANCE --no-disable-api-termination
aws ec2 terminate-instances --instance-ids $INSTANCE
aws ec2 wait instance-terminated --instance-ids $INSTANCE

# The root volume deliberately survives termination — delete it explicitly once
# you are sure the data is not wanted.
aws ec2 describe-volumes --filters Name=status,Values=available \
  --query 'Volumes[].{Id:VolumeId,Created:CreateTime,Size:Size}' --output table

aws ec2 delete-security-group --group-id $SG
aws iam remove-role-from-instance-profile --instance-profile-name $NAME --role-name $NAME
aws iam delete-instance-profile --instance-profile-name $NAME
aws iam delete-role-policy --role-name $NAME --policy-name weblate-secrets
aws iam detach-role-policy --role-name $NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam delete-role --role-name $NAME

for p in oidc_key oidc_secret postgres_password admin_password github_token smtp_user smtp_password; do
  aws ssm delete-parameter --name "/weblate/$p"
done
```
