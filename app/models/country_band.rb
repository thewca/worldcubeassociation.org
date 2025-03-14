# frozen_string_literal: true

class CountryBand < ApplicationRecord
  belongs_to :country, foreign_key: :iso2, primary_key: :iso2
  has_many :country_band_details, foreign_key: :number, primary_key: :number
  validates :iso2, inclusion: { in: Country::WCA_COUNTRY_ISO_CODES }
  validates :number, numericality: {
    only_integer: true,
    greater_than_or_equal_to: 0,
    less_than_or_equal_to: 5,
  }

  def country
    Country.find_by(iso2: self.iso2)
  end

  def active_country_band_detail
    country_band_details.active.first
  end
end
