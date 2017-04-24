# frozen_string_literal: true

class RanksSingle < ApplicationRecord
  include PersonalBest
  self.table_name = "RanksSingle"

  def to_wcif
    rank_to_wcif("single")
  end

  def to_s
    SolveTime.new(eventId, :best, best).clock_format
  end

  # Alises for SQL camelCase columns
  alias_attribute :event_id, :eventId
  alias_attribute :country_rank, :countryRank
  alias_attribute :continent_rank, :continentRank
  alias_attribute :world_rank, :worldRank
end
