# frozen_string_literal: true

class CountryBand < ApplicationRecord
  BANDS = {
    0 => {
      value: 0.00,
    },
    1 => {
      value: 0.19,
    },
    2 => {
      value: 0.32,
    },
    3 => {
      value: 0.45,
    },
    4 => {
      value: 2.28,
    },
    5 => {
      value: 3.00,
    },
  }.freeze

  # According to WCA's current dues policy, the due amount per competitor is equivalent
  # to this percent of registration fee. Only used if this due amount per competitor is
  # larger than the due amount per competitor calculated from the competition's country band.
  PERCENT_REGISTRATION_FEE_USED_FOR_DUE_AMOUNT = 0.15

  def self.percent_registration_fee_used_for_due_amount(country_band)
    return 0 if country_band.nil?
    if country_band >= 3
      0.15
    elsif country_band >= 1
      0.05
    else
      0.00
    end
  end

  belongs_to :country, foreign_key: :iso2, primary_key: :iso2
  validates_inclusion_of :iso2, in: Country.real.map(&:iso2).freeze
  validates_inclusion_of :number, in: BANDS.keys.freeze

  def country
    Country.find_by_iso2(self.iso2)
  end
end
