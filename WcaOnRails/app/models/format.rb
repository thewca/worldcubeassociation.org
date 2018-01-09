# frozen_string_literal: true

class Format < ApplicationRecord
  include Cachable
  self.table_name = "Formats"

  has_many :preferred_formats
  has_many :events, through: :preferred_formats

  scope :recommended, -> { where("ranking = 1") }

  def allowed_first_phase_formats
    {
      "1" => [],
      "2" => [ "1" ],
      "3" => [ "1", "2" ],
      "m" => [ "1", "2" ],
      "a" => [ "2" ], # https://www.worldcubeassociation.org/regulations/#9b1
    }[self.id]
  end

  def serializable_hash(options = nil)
    {
      id: self.id,
      name: self.name,
      sort_by: self.sort_by,
      sort_by_second: self.sort_by_second,
      expected_solve_count: self.expected_solve_count,
      trim_fastest_n: self.trim_fastest_n,
      trim_slowest_n: self.trim_slowest_n,
      allowed_first_phase_formats: self.allowed_first_phase_formats,
    }
  end
end
