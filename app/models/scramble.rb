# frozen_string_literal: true

class Scramble < ApplicationRecord
  belongs_to :competition

  validates :group_id, format: { presence: true, with: /\A[A-Z]+\Z/, message: "Invalid scramble group name" }
  validates :event_id, presence: true
  validates :round_type_id, presence: true
  validates :scramble, presence: true
  validates :scramble_num, numericality: { presence: true, greater_than: 0 }
  validates :is_extra, inclusion: { presence: true, in: [true, false] }

  def round_type
    RoundType.c_find(round_type_id)
  end
end
