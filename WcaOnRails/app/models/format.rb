# frozen_string_literal: true

class Format < ApplicationRecord
  include Cachable
  self.table_name = "Formats"

  has_many :preferred_formats
  has_many :events, through: :preferred_formats

  scope :recommended, -> { where("ranking = 1") }

  def serializable_hash(options = nil)
    {
      id: self.id,
      name: self.name,
      sort_by: self.sort_by,
      sort_by_second: self.sort_by_second,
      expected_solve_count: self.expected_solve_count,
      trim_fastest_n: self.trim_fastest_n,
      trim_slowest_n: self.trim_slowest_n,
    }
  end
end
