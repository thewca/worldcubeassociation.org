# frozen_string_literal: true

class DropLiveAttemptHistoryEntries < ActiveRecord::Migration[8.1]
  def change
    drop_table :live_attempt_history_entries
  end
end
