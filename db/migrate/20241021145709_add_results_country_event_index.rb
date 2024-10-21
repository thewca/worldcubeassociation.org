# frozen_string_literal: true

class AddResultsCountryEventIndex < ActiveRecord::Migration[7.2]
  def change
    add_index :Results, [:eventId, :countryId]
  end
end
