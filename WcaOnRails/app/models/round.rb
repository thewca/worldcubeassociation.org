# frozen_string_literal: true
class Round < ActiveRecord::Base
  self.table_name = "Rounds"

  has_many :results, foreign_key: :roundId

  scope :final_rounds, -> { where("final = 1") }

  MAX_ID_LENGTH = 1
  MAX_NAME_LENGTH = 11
  MAX_CELLNAME_LENGTH = 45
  validates :id, presence: true, uniqueness: true, length: { maximum: MAX_ID_LENGTH }
  validates :name, presence: true, uniqueness: true, length: { maximum: MAX_NAME_LENGTH }
  validates :rank, numericality: { only_integer: true }
  validates :cellName, presence: true, uniqueness: true, length: { maximum: MAX_CELLNAME_LENGTH }

end
