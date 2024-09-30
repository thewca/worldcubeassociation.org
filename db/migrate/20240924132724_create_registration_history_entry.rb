# frozen_string_literal: true

class CreateRegistrationHistoryEntry < ActiveRecord::Migration[7.2]
  def change
    create_table :registration_history_entries do |t|
      t.references :registration, index: true
      t.string :actor_type
      t.string :actor_id
      t.string :action

      t.timestamps
    end
  end
end
