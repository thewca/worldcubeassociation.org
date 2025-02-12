# frozen_string_literal: true

module DuesCalculator
  def self.dues_per_competitor(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    dues_per_competitor_in_usd_money = dues_per_competitor_in_usd(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    dues_per_competitor_in_usd_money&.exchange_to(currency_code)
  rescue CurrencyUnavailable
    nil
  end

  def self.dues_per_competitor_in_usd(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    country_band = CountryBand.find_by(iso2: country_iso2)
    country_band_detail = country_band&.active_country_band_detail
    registration_fees = Money.new(base_entry_fee_lowest_denomination, currency_code).exchange_to("USD")

    # Calculation of 'registration fee dues'
    due_percent_registration_fee = country_band_detail&.due_percent_registration_fee.to_f || 0
    registration_fee_dues = registration_fees * due_percent_registration_fee / 100

    # Calculation of 'country band dues'
    due_amount_per_competitor_us_cents = country_band_detail&.due_amount_per_competitor_us_cents || 0
    country_band_dues = Money.new(due_amount_per_competitor_us_cents, "USD")

    # The maximum of the two is the total dues per competitor
    [registration_fee_dues, country_band_dues].max
  rescue Money::Currency::UnknownCurrency, CurrencyUnavailable
    nil
  end
end
