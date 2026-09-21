# Mounted at /app/data/settings-override.py and exec'd inside Weblate's settings
# namespace, so SOCIAL_AUTH_PIPELINE below is the live list.
#
# Neither of these is reachable through a WEBLATE_* environment variable, which
# is why this file exists. See DEPLOYMENT.md.

# Extends the backend default, so the authorization request asks for
# "openid profile email translations".
SOCIAL_AUTH_OIDC_SCOPE = ["translations"]

SOCIAL_AUTH_PIPELINE.append("customize.wca.sync_translator_languages")  # noqa: F821
