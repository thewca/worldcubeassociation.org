# frozen_string_literal: true

class Scramble < ApplicationRecord
  belongs_to :competition

  validates_format_of :group_id, presence: true, with: /\A[A-Z]+\Z/, message: "Invalid scramble group name"
  validates_presence_of :event_id
  validates_presence_of :round_type_id
  validates_presence_of :scramble
  validates_numericality_of :scramble_num, presence: true, greater_than: 0
  validates_inclusion_of :is_extra, presence: true, in: [true, false]

  def round_type
    RoundType.c_find(round_type_id)
  end
end
