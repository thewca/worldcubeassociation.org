# frozen_string_literal: true

class Championship < ApplicationRecord
  belongs_to :competition
  validates_presence_of :competition
  validates :championship_type, uniqueness: { scope: :competition_id }
end
