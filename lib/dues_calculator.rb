# frozen_string_literal: true

module DuesCalculator
  def self.dues_per_competitor(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    dues_per_competitor_in_usd_money = dues_per_competitor_in_usd(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    dues_per_competitor_in_usd_money&.exchange_to(currency_code)
  end

  def self.dues_per_competitor_in_usd(country_iso2, base_entry_fee_lowest_denomination, currency_code)
    return nil if DuesCalculator.error_in_dues_calculation(country_iso2, currency_code).present?

    country_band = CountryBand.find_by(iso2: country_iso2)
    country_band_detail = country_band&.active_country_band_detail

    # Calculation of 'registration fee dues'
    registration_fees_in_usd = Money.new(base_entry_fee_lowest_denomination, currency_code).exchange_to("USD")
    registration_fee_dues = registration_fees_in_usd * country_band_detail.due_percent_registration_fee / 100.0

    # Calculation of 'country band dues'
    country_band_dues = Money.new(country_band_detail.due_amount_per_competitor_us_cents, "USD")

    # The maximum of the two is the total dues per competitor
    [registration_fee_dues, country_band_dues].max
  end

  def self.error_in_dues_calculation(country_iso2, currency_code)
    country_band = CountryBand.find_by(iso2: country_iso2)
    if country_band.nil?
      "Country band not found."
    elsif country_band.active_country_band_detail.nil?
      "Country band detail not found for #{country_band.iso2}."
    elsif !Money::Currency.table.key?(currency_code.downcase.to_sym)
      "Currency #{currency_code} is not supported."
    elsif currency_code != 'USD' && Money.default_bank.get_rate(currency_code, 'USD').nil?
      "Currency #{currency_code} cannot be converted to USD."
    end
    # Money.default_bank.get_rate will return CurrencyUnavailable if the currency cannot be
    # converted. There is currently no way to check if the currency exists because of poor
    # code design of EuCentralBank. Till we have a method, we will use rescue to catch the
    # error.
  rescue CurrencyUnavailable
    "Currency #{currency_code} cannot be converted to USD."
  end
end
