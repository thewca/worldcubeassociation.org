# frozen_string_literal: true

class AddNewcomerReservedSpotsToCompetitions < ActiveRecord::Migration[7.2]
  def change
    add_column :Competitions, :newcomer_reserved_spots, :integer, default: 0, null: false
  end
end
