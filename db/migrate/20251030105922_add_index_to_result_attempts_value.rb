# frozen_string_literal: true

class AddIndexToResultAttemptsValue < ActiveRecord::Migration[7.2]
  def change
    add_index :result_attempts, :value
    add_index :result_attempts, [:value, :result_id]
  end
end
