# frozen_string_literal: true

require 'money/bank/currencylayer_bank'

Money.locale_backend = :i18n

if Rails.env.test? || Rails.env.development?
  eu_bank = EuCentralBank.new
  Money.default_bank = eu_bank
else
  mclb = Money::Bank::CurrencylayerBank.new
  mclb.access_key = AppSecrets.CURRENCY_LAYER_API_KEY
  mclb.currencylayer = true
  mclb.ttl_in_seconds = 86_400
  mclb.cache = proc.new do |payload|
    key = 'money:currencylayer_bank'
    if payload
      Rails.cache.write(key, payload)
    else
      Rails.cache.read(key)
    end
  end
  mclb.update_rates
  Money.default_bank = mclb
end

Money.default_currency = Money::Currency.new("USD")
Money.rounding_mode = BigDecimal::ROUND_HALF_UP
