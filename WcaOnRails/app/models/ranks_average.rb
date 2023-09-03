# frozen_string_literal: true

class RanksAverage < ApplicationRecord
  # ActiveRecord inflects the last word, so by default, this would be 'ranks_averages'
  self.table_name = 'ranks_average'

  include PersonalBest

  def to_wcif
    rank_to_wcif("average")
  end

  def to_s
    solve_time.clock_format
  end

  def solve_time
    SolveTime.new(event_id, :average, best)
  end

  def event
    Event.c_find(event_id)
  end
end
