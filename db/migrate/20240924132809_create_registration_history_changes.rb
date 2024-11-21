# frozen_string_literal: true

class CreateRegistrationHistoryChanges < ActiveRecord::Migration[7.2]
  def change
    create_table :registration_history_changes do |t|
      t.references :registration_history_entry, foreign_key: true, index: true
      t.string :key
      t.string :value

      t.timestamps
    end
  end
end
