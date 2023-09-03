# frozen_string_literal: true

class RanksSingle < ApplicationRecord
  # ActiveRecord inflects the last word, so by default, this would be 'ranks_singles'
  self.table_name = 'ranks_single'

  include PersonalBest

  def to_wcif
    rank_to_wcif("single")
  end

  def to_s
    solve_time.clock_format
  end

  def solve_time
    SolveTime.new(event_id, :best, best)
  end

  def event
    Event.c_find(event_id)
  end
end
