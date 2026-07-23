# frozen_string_literal: true

class AddResultAttemptsIndex < ActiveRecord::Migration[8.1]
  def change
    change_table :result_attempts, bulk: true do |t|
      t.index %w[result_id value attempt_number]
    end
  end
end
