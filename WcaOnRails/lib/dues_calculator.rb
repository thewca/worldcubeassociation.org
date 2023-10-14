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

    DuesCalculator.update_exchange_rates_if_needed
    input_money_us_dollars = Money.new(base_entry_fee_lowest_denomination, currency_code).exchange_to("USD")

    registration_fee_dues_us_dollars = input_money_us_dollars * CountryBand::PERCENT_REGISTRATION_FEE_USED_FOR_DUE_AMOUNT
    country_band_dues_us_dollars = country_band.present? && country_band > 0 ? CountryBand::BANDS[country_band][:value] : 0
    # times 100 because Money require lowest currency subunit, which is cents for USD
    country_band_dues_us_dollars_money = Money.new(country_band_dues_us_dollars * 100, "USD")

    [registration_fee_dues_us_dollars, country_band_dues_us_dollars_money].max
  rescue Money::Currency::UnknownCurrency, CurrencyUnavailable
    nil
  end
end
