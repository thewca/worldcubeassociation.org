# frozen_string_literal: true

require 'money/bank/currencylayer_bank'

Money.locale_backend = :i18n

mclb = Money::Bank::CurrencylayerBank.new
mclb.access_key = ENV.fetch("CURRENCY_LAYER_API_KEY", "")
mclb.currencylayer = true
mclb.ttl_in_seconds = 86_400
mclb.cache = 'rails_money_cache.txt' # To be replaced with proper cache path.
mclb.update_rates

Money.default_bank = mclb
Money.default_currency = Money::Currency.new("USD")
Money.rounding_mode = BigDecimal::ROUND_HALF_UP
