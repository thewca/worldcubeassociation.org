# frozen_string_literal: true

class LiveAttemptsRenameResultToValue < ActiveRecord::Migration[8.1]
  def change
    rename_column :live_attempts, :result, :value
  end
end
