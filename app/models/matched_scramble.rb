# frozen_string_literal: true

class MatchedScramble < ApplicationRecord
  belongs_to :matched_scramble_set
  belongs_to :external_scramble, optional: true

  scope :not_extra, -> { where(is_extra: false) }

  validates :ordered_index, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                            uniqueness: { scope: :matched_scramble_set_id }

  delegate :scramble_string, :is_extra, to: :external_scramble, prefix: :external, allow_nil: true

  validates :external_scramble_string, comparison: { equal_to: :scramble_string, allow_nil: true }
  validates :external_is_extra, comparison: { equal_to: :is_extra, allow_nil: true }
end
