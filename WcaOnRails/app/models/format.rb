# frozen_string_literal: true

class Format < ApplicationRecord
  include Cachable
  self.table_name = "Formats"

  has_many :preferred_formats
  has_many :events, through: :preferred_formats

  scope :recommended, -> { where("ranking = 1") }
end
