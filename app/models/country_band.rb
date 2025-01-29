# frozen_string_literal: true

class CountryBand < ApplicationRecord
  belongs_to :country, foreign_key: :iso2, primary_key: :iso2
  validates_inclusion_of :iso2, in: Country::WCA_COUNTRY_ISO_CODES

  def country
    Country.find_by_iso2(self.iso2)
  end

  def active_country_band_detail
    CountryBandDetail.active.find_by(number: self.number)
  end
end
