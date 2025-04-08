# frozen_string_literal: true

class RenameRanksTables < ActiveRecord::Migration[7.2]
  def change
    change_table :RanksSingle, bulk: true do |t|
      t.rename :personId, :person_id
      t.rename :eventId, :event_id
      t.rename :worldRank, :world_rank
      t.rename :continentRank, :continent_rank
      t.rename :countryRank, :country_rank
    end

    rename_table :RanksSingle, :ranks_single

    change_table :RanksAverage, bulk: true do |t|
      t.rename :personId, :person_id
      t.rename :eventId, :event_id
      t.rename :worldRank, :world_rank
      t.rename :continentRank, :continent_rank
      t.rename :countryRank, :country_rank
    end

    rename_table :RanksAverage, :ranks_average
  end
end
