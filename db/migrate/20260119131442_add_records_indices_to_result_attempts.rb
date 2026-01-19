# frozen_string_literal: true

class AddRecordsIndicesToResultAttempts < ActiveRecord::Migration[8.1]
  def change
    add_index :result_attempts, :value
  end
end
