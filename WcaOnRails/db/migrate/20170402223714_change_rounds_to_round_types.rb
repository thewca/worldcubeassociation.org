# frozen_string_literal: true
class ChangeRoundsToRoundTypes < ActiveRecord::Migration[5.0]
  def change
    rename_table :Rounds, :RoundTypes
  end
end
