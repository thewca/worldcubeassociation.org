# frozen_string_literal: true

class AddUniquenessOnLrIdAndAttemptNumber < ActiveRecord::Migration[8.1]
  def change
    add_index :live_attempts, %i[live_result_id attempt_number], unique: true
  end
end
