# frozen_string_literal: true

class AddResultAttemptsIndex < ActiveRecord::Migration[8.1]
  def change
    change_table :result_attempts, bulk: true do |t|
      t.index ["result_id", "attempt_number", "value"]
    end
  end
end
