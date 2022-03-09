# frozen_string_literal: true

class UpdateCurrencyRates < SingletonApplicationJob
  CURRENCY_RATES_UPDATE_INTERVAL = 1.days
  queue_as :default

  def perform
    if !Money.default_bank.rates_updated_at || Money.default_bank.rates_updated_at < CURRENCY_RATES_UPDATE_INTERVAL.ago
      Money.default_bank.update_rates
    end
  end
end
