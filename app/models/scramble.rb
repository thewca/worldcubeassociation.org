# frozen_string_literal: true

class Scramble < ApplicationRecord
  belongs_to :competition

  validates :group_id, format: { presence: true, with: /\A[A-Z]+\Z/, message: "Invalid scramble group name" }
  validates :event_id, presence: true
  validates :round_type_id, presence: true
  validates :scramble, presence: true
  validates :scramble_num, numericality: { presence: true, greater_than: 0 }
  validates :is_extra, inclusion: { presence: true, in: [true, false] }

  # FIXME: GB Remove this after all other snake_case migrations are done
  alias_attribute :competitionId, :competition_id

  def round_type
    RoundType.c_find(round_type_id)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "competition_id", "event_id", "round_type_id", "group_id",
           "is_extra", "scramble_num", "scramble"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
