# frozen_string_literal: true

class CountryBandDetail < ApplicationRecord
  scope :active, -> { where(end_date: nil).or(inactive.invert_where) }
  scope :inactive, -> { where(end_date: ..Date.today) }
end
