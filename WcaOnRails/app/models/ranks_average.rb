# frozen_string_literal: true

class RanksAverage < ApplicationRecord
  include PersonalBest
  self.table_name = "RanksAverage"

  def to_wcif
    rank_to_wcif("average")
  end

  def to_s
    SolveTime.new(eventId, :average, best).clock_format
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
