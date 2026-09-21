"""Map the WCA OIDC `translator_locales` claim onto Weblate team membership.

Mounted into the container at /app/data/python/customize/, which Weblate has
already installed as a Django application, and hooked into the authentication
pipeline by settings-override.py. See DEPLOYMENT.md.

Weblate has no built-in claim-to-team mapping — its only no-code automatic
assignment is a regex on e-mail address, and nothing in
`weblate/accounts/pipeline.py` touches groups or claims.
"""

from weblate.auth.models import Group
from weblate.lang.models import Language

TEAM_NAME = "WCA Translators"


def sync_translator_languages(backend, user, response, *args, **kwargs):
    if backend.name != "oidc" or user is None:
        return

    # fuzzy_get returns a Language or, when nothing matched, a plain string.
    languages = [
        language
        for language in (
            Language.objects.fuzzy_get(code)
            for code in response.get("translator_locales") or []
        )
        if isinstance(language, Language)
    ]

    team = Group.objects.get(name=TEAM_NAME)

    if not languages:
        user.groups.remove(team)
        return

    # groups.add creates the membership row; set_limit_languages then narrows
    # that one member to their own locales.
    user.groups.add(team)
    user.team_memberships.get(group=team).set_limit_languages(languages)
