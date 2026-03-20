# frozen_string_literal: true

class MatchedScrambleSet < ApplicationRecord
  default_scope { order(:ordered_index) }

  belongs_to :round
  belongs_to :external_scramble_set, optional: true

  has_many :matched_scrambles, dependent: :destroy

  validates :ordered_index, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                            uniqueness: { scope: :round_id }

  delegate :competition_id, :event_id, :round_type_id, to: :round

  def alphabetic_group_index
    Scramble.prefix_for_index(self.ordered_index + 1)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[matched_scrambles],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
