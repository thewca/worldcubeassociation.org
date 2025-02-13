# frozen_string_literal: true

class AddIndicesToRce < ActiveRecord::Migration[7.2]
  def change
    add_index :registration_competition_events, :competition_event_id
    add_index :registration_competition_events, :registration_id
  end
end
