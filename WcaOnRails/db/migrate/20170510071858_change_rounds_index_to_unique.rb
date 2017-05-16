# frozen_string_literal: true

class ChangeRoundsIndexToUnique < ActiveRecord::Migration[5.0]
  def change
    remove_index :rounds, [:competition_event_id, :number]
    add_index :rounds, [:competition_event_id, :number], unique: true
  end
end
