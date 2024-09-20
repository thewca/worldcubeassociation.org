# frozen_string_literal: true

class AddIndexesToConciseTables < ActiveRecord::Migration[7.2]
  def change
    add_index :ConciseSingleResults, :personId
    add_index :ConciseAverageResults, :personId

    add_index :ConciseSingleResults, :countryId
    add_index :ConciseAverageResults, :countryId

    add_index :ConciseSingleResults, :eventId
    add_index :ConciseAverageResults, :eventId

    add_index :Results, [:best, :countryId]
    add_index :Results, [:average, :countryId]
  end
end
