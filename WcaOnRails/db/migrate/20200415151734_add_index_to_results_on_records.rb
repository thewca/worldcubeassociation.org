# frozen_string_literal: true

class AddIndexToResultsOnRecords < ActiveRecord::Migration[5.2]
  def change
    add_index :Results, [:regionalSingleRecord, :eventId]
    add_index :Results, [:regionalAverageRecord, :eventId]
  end
end
