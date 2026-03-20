# frozen_string_literal: true

class ExternalScramble < ApplicationRecord
  belongs_to :external_scramble_set

  scope :not_extra, -> { where(is_extra: false) }

  validates :scramble_number, uniqueness: { scope: %i[is_extra external_scramble_set_id] }
end
