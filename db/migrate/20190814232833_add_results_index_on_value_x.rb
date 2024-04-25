# frozen_string_literal: true

class AddResultsIndexOnValueX < ActiveRecord::Migration[5.2]
  def change
    add_index :Results, [:eventId, :value1]
    add_index :Results, [:eventId, :value2]
    add_index :Results, [:eventId, :value3]
    add_index :Results, [:eventId, :value4]
    add_index :Results, [:eventId, :value5]
  end
end
