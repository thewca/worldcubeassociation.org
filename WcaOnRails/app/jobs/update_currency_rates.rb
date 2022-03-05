# frozen_string_literal: true

class UpdateCurrencyRates < SingletonApplicationJob
  queue_as :default

  def perform
    if !Money.default_bank.rates_updated_at || Money.default_bank.rates_updated_at < 1.days.ago
      Money.default_bank.update_rates
    end
  end
end
