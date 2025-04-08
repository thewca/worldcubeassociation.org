# frozen_string_literal: true

class RenameConciseResultsTables < ActiveRecord::Migration[7.2]
  def change
    change_table :ConciseSingleResults, bulk: true do |t|
      t.rename :valueAndId, :value_and_id
      t.rename :personId, :person_id
      t.rename :eventId, :event_id
      t.rename :countryId, :country_id
      t.rename :continentId, :continent_id
    end

    rename_table :ConciseSingleResults, :concise_single_results

    change_table :ConciseAverageResults, bulk: true do |t|
      t.rename :valueAndId, :value_and_id
      t.rename :personId, :person_id
      t.rename :eventId, :event_id
      t.rename :countryId, :country_id
      t.rename :continentId, :continent_id
    end

    rename_table :ConciseAverageResults, :concise_average_results
  end
end
