# frozen_string_literal: true

class H2hSet < ApplicationRecord
  belongs_to :h2h_match
  has_many :h2h_attempts, dependent: :destroy

  def to_h2h_json
    {
      set_number: set_number,
      attempts: h2h_attempts.map(&:to_h2h_json),
    }
  end
end
