# frozen_string_literal: true

class CountryBandDetail < ApplicationRecord
  belongs_to :country_band, foreign_key: :number, primary_key: :number, inverse_of: :country_band_details

  scope :active, -> { where(end_date: nil).or(where.not(end_date: ..Date.today)) }
  scope :inactive, -> { where(end_date: ..Date.today) }
end
