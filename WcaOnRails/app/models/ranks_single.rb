# frozen_string_literal: true

class RanksSingle < ApplicationRecord
  include PersonalBest
  self.table_name = "RanksSingle"

  def to_wcif
    rank_to_wcif("single")
  end

  def to_s(field)
    SolveTime.new(eventId, :best, send(field)).clock_format
  end
end
