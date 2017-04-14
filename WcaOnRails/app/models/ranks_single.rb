# frozen_string_literal: true

class RanksSingle < ApplicationRecord
  self.table_name = "RanksSingle"

  def to_s(field)
    SolveTime.new(eventId, :best, send(field)).clock_format
  end
end
