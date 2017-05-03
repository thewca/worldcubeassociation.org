# frozen_string_literal: true

class AddIndexOnResultsCountryId < ActiveRecord::Migration[5.0]
  def change
    add_index :Results, :countryId
  end
end
