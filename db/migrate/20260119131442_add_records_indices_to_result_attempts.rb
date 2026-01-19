# frozen_string_literal: true

class AddRecordsIndicesToResultAttempts < ActiveRecord::Migration[8.1]
  def change
    change_table :result_attempts, bulk: true do |t|
      t.index :value
      t.index %i[value result_id]
    end
  end
end
