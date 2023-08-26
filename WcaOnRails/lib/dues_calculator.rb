# frozen_string_literal: true

module DuesCalculator
  def self.update_exchange_rates_if_needed
    if !Money.default_bank.rates_updated_at || Money.default_bank.rates_updated_at < 1.day.ago
      Money.default_bank.update_rates
    end
  end

  def self.dues_per_competitor_in_usd(competition)
    country_band = CountryBand.find_by(iso2: competition.country_iso2)&.number

    DuesCalculator.update_exchange_rates_if_needed
    input_money_us_dollars = Money.new(competition.base_entry_fee_lowest_denomination.to_i, competition.currency_code).exchange_to("USD").amount

    registration_fee_dues_us_dollars = input_money_us_dollars * CountryBand::PERCENT_REGISTRATION_FEE_USED_FOR_DUE_AMOUNT
    country_band_dues_us_dollars = CountryBand::BANDS[country_band][:value] if country_band.present? && country_band > 0

    [registration_fee_dues_us_dollars, country_band_dues_us_dollars].compact.max
  end
end
