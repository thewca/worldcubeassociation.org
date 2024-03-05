# frozen_string_literal: true

class AddEventFeesToCompetitionEvents < ActiveRecord::Migration[5.0]
  def change
    add_column :competition_events, :fee_lowest_denomination, :integer, null: false, default: 0
  end
end
