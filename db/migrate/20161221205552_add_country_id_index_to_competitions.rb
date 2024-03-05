# frozen_string_literal: true

class AddCountryIdIndexToCompetitions < ActiveRecord::Migration
  def change
    add_index :Competitions, :countryId
  end
end
