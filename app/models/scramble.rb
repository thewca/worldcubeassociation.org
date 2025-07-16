# frozen_string_literal: true

class Scramble < ApplicationRecord
  belongs_to :competition
  belongs_to :round, optional: true

  validates :group_id, format: { presence: true, with: /\A[A-Z]+\Z/, message: "Invalid scramble group name" }
  validates :event_id, presence: true
  validates :round_type_id, presence: true
  validates :scramble, presence: true
  validates :scramble_num, numericality: { presence: true, greater_than: 0 }
  validates :is_extra, inclusion: { presence: true, in: [true, false] }

  # See the explanation in `resultable.rb` which has a validation with the same name.
  validate :linked_round_consistent, if: :round_id?
  def linked_round_consistent
    errors.add(:competition, "Should match '#{round.competition_id}' of the linked round, but is '#{competition_id}'") unless competition_id == round.competition_id
    errors.add(:round_type, "Should match '#{round.round_type_id}' of the linked round, but is '#{round_type_id}'") unless round_type_id == round.round_type_id
    errors.add(:event, "Should match '#{round.event_id}' of the linked round, but is '#{event_id}'") unless event_id == round.event_id
  end

  def round_type
    RoundType.c_find(round_type_id)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id competition_id event_id round_type_id round_id
             group_id is_extra scramble_num scramble],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
