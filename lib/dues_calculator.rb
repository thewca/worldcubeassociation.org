# frozen_string_literal: true

module DuesCalculator
  def self.update_exchange_rates_if_needed
    if !Money.default_bank.rates_updated_at || Money.default_bank.rates_updated_at < 1.day.ago
      Money.default_bank.update_rates
    end
  end

  def self.dues_for_n_competitors(country_iso2, base_entry_fee_lowest_denomination, currency_code, n)
    dues_per_competitor_in_usd_money = dues_per_competitor_in_usd(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    if dues_per_competitor_in_usd_money.present?
      (dues_per_competitor_in_usd_money * n).exchange_to(currency_code)
    else
      nil
    end
  rescue CurrencyUnavailable
    nil
  end

  def self.dues_per_competitor_in_usd(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    country_band = CountryBand.find_by(iso2: country_iso2)&.number
    country_band_detail = CountryBandDetail.find_by(number: country_band)
    registration_fees = Money.new(base_entry_fee_lowest_denomination, currency_code).exchange_to("USD")

    DuesCalculator.update_exchange_rates_if_needed

    # Calculation of 'registration fee dues'
    registration_fee_dues = Money.new(registration_fees * (country_band_detail&.due_percent_registration_fee.to_f || 0) / 100, "USD")

    # Calculation of 'country band dues'
    country_band_dues = Money.new(country_band_detail&.due_amount_per_competitor_in_cents || 0, "USD")

    # The maximum of the two is the total dues per competitor
    [registration_fee_dues, country_band_dues].max
  rescue Money::Currency::UnknownCurrency, CurrencyUnavailable
    nil
  end
end
