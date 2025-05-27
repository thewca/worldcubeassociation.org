# frozen_string_literal: true

class AddRecordComputationIndeces < ActiveRecord::Migration[7.2]
  def change
    add_index :results, [:event_id, :average, :id]
    add_index :results, [:event_id, :best, :id]
    add_index :result_timestamps, [:round_timestamp, :result_id]
  end
end
