# frozen_string_literal: true

Stripe.api_key = ENVied.STRIPE_API_KEY
# FIXME: to be updated in the dashboard when the PR is merged
Stripe.api_version = "2019-09-09"
