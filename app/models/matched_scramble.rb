# frozen_string_literal: true

class MatchedScramble < ApplicationRecord
  default_scope { order(:is_extra, :ordered_index) }

  belongs_to :matched_scramble_set
  belongs_to :external_scramble, optional: true

  has_one :round, through: :matched_scramble_set

  scope :not_extra, -> { where(is_extra: false) }

  validates :ordered_index, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                            uniqueness: { scope: %i[is_extra matched_scramble_set_id] }

  delegate :competition_id, :event_id, :round_type_id, :group_id, to: :matched_scramble_set
  delegate :scramble_string, to: :external_scramble, prefix: :external, allow_nil: true

  validates :scramble_string, comparison: { equal_to: :external_scramble_string, if: :external_scramble_id? }

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[external_scramble],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
