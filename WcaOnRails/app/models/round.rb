# frozen_string_literal: true
class Round < AbstractCachedModel
  self.table_name = "Rounds"

  has_many :results, foreign_key: :roundId

  scope :final_rounds, -> { where("final = 1") }
end
