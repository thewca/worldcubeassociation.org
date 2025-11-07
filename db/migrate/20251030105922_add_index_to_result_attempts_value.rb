# frozen_string_literal: true

class AddIndexToResultAttemptsValue < ActiveRecord::Migration[7.2]
  def change
    change_table :result_attempts, bulk: true do |t|
      t.index :value
      t.index %i[value result_id]
    end
  end
end
