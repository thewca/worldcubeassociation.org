# frozen_string_literal: true

class ChangeRoundsToRoundTypes < ActiveRecord::Migration[5.0]
  def change
    rename_table :Rounds, :RoundTypes

    rename_column :InboxResults, :roundId, :roundTypeId
    rename_column :Results, :roundId, :roundTypeId
    rename_column :Scrambles, :roundId, :roundTypeId
  end
end
