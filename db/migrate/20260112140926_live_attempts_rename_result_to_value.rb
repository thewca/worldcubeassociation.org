# frozen_string_literal: true

class LiveAttemptsRenameResultToValue < ActiveRecord::Migration[8.1]
  def change
    rename_column :live_attempts, :result, :value
    rename_column :live_attempt_history_entries, :result, :value
  end
end
