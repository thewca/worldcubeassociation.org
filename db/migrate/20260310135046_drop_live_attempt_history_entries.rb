# frozen_string_literal: true

class DropLiveAttemptHistoryEntries < ActiveRecord::Migration[8.1]
  def change
    drop_table :live_attempt_history_entries do |t|
      t.datetime :entered_at, null: false
      t.string :entered_by, null: false
      t.references :live_attempt, null: false, foreign_key: true
      t.integer :value, null: false

      t.timestamps
    end
  end
end
