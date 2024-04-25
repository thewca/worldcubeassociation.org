# frozen_string_literal: true

class RanksSingle < ApplicationRecord
  include PersonalBest
  self.table_name = "RanksSingle"

  belongs_to :event, foreign_key: "eventId"

  def to_wcif
    rank_to_wcif("single")
  end

  def to_s
    solve_time.clock_format
  end

  def solve_time
    SolveTime.new(eventId, :best, best)
  end

  def event
    Event.c_find(eventId)
  end

  # Alises for SQL camelCase columns
  alias_attribute :event_id, :eventId
  alias_attribute :country_rank, :countryRank
  alias_attribute :continent_rank, :continentRank
  alias_attribute :world_rank, :worldRank
end
