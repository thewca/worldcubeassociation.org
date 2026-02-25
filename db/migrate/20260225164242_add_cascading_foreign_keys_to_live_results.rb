# frozen_string_literal: true

class AddCascadingForeignKeysToLiveResults < ActiveRecord::Migration[8.1]
  def change
    # First, make sure we cascade for live_attempt_history_entries so when we delete orphaned attempts
    # it will also delete the orphaned live_attempt_history_entries
    remove_foreign_key :live_attempt_history_entries, :live_attempts
    add_foreign_key :live_attempt_history_entries, :live_attempts, column: :live_attempt_id, on_delete: :cascade

    # Clean up orphaned live_attempts (live_result_id points to a non-existent live_result)
    execute <<~SQL
      DELETE FROM live_attempts
      WHERE live_result_id IS NOT NULL
        AND live_result_id NOT IN (SELECT id FROM live_results)
    SQL

    remove_index :live_attempts, :live_result_id
    add_foreign_key :live_attempts, :live_results, column: :live_result_id, on_delete: :cascade
  end
end
