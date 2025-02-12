# frozen_string_literal: true

class CountryBandDetail < ApplicationRecord
  scope :active, -> { where(end_date: nil).or(where.not(end_date: ..Date.today)) }
  scope :inactive, -> { where(end_date: ..Date.today) }
end
