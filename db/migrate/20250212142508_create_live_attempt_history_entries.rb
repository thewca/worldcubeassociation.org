# rubocop:disable all
# frozen_string_literal: true

class CreateLiveAttemptHistoryEntries < ActiveRecord::Migration[7.2]
  def change
    create_table :live_attempt_history_entries do |t|
      t.datetime :entered_at, null: false
      t.string :entered_by, null: false
      t.references :live_attempt, null: false, foreign_key: true
      t.integer :result, null: false

      t.timestamps
    end

    remove_column :live_attempts, :entered_at, :datetime
    remove_column :live_attempts, :entered_by_id, :integer
    remove_column :live_attempts, :replaced_by_id, :integer
  end
end
