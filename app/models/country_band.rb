# frozen_string_literal: true

class CountryBand < ApplicationRecord
  belongs_to :country, foreign_key: :iso2, primary_key: :iso2
  belongs_to :country_band_detail, foreign_key: :number, primary_key: :number
  validates_inclusion_of :iso2, in: Country::WCA_COUNTRY_ISO_CODES

  def country
    Country.find_by_iso2(self.iso2)
  end
end
