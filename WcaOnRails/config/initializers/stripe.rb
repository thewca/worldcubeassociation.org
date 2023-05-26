# frozen_string_literal: true

Stripe.api_key = read_secret("STRIPE_API_KEY")
Stripe.api_version = "2019-09-09"
