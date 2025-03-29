# rubocop:disable all
# frozen_string_literal: true

class AddNewcomerReservedSpotsToCompetitions < ActiveRecord::Migration[7.2]
  def change
    add_column :Competitions, :newcomer_month_reserved_spots, :integer
  end
end
