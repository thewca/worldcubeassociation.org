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

    return nil if country_band_detail.nil?

    # Calculation of 'registration fee dues'
    registration_fees_in_usd = Money.new(base_entry_fee_lowest_denomination, currency_code).exchange_to("USD")
    registration_fee_dues = registration_fees_in_usd * country_band_detail.due_percent_registration_fee / 100.0

    # Calculation of 'country band dues'
    country_band_dues = Money.new(country_band_detail.due_amount_per_competitor_us_cents, "USD")

    # The maximum of the two is the total dues per competitor
    [registration_fee_dues, country_band_dues].max
  rescue Money::Currency::UnknownCurrency, CurrencyUnavailable, Money::Bank::UnknownRate
    nil
  end
end
