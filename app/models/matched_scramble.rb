# frozen_string_literal: true

class MatchedScramble < ApplicationRecord
  default_scope { order(:ordered_index) }

  belongs_to :matched_scramble_set
  belongs_to :external_scramble, optional: true

  scope :not_extra, -> { where(is_extra: false) }

  validates :ordered_index, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                            uniqueness: { scope: :matched_scramble_set_id }

  delegate :scramble_string, :is_extra_tinyint, to: :external_scramble, prefix: :external, allow_nil: true

  validates :scramble_string, comparison: { equal_to: :external_scramble_string, if: :external_scramble_id? }
  # You cannot validate `is_extra` directly, because the `comparison` validator internally checks `value.blank?` first
  #   and unfortunately `false.blank?` evaluates to `true` even though it's a perfectly fine value to compare to…
  validates :is_extra_tinyint, comparison: { equal_to: :external_is_extra_tinyint, if: :external_scramble_id? }

  # rubocop:disable Naming/PredicatePrefix
  #   The original database attribute is called `is_extra`, so we enforce this name
  def is_extra_tinyint
    self.is_extra? ? 1 : 0
  end
  # rubocop:enable Naming/PredicatePrefix

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[external_scramble],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
