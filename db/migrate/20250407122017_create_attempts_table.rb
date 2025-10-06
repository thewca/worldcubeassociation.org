# frozen_string_literal: true

class CreateAttemptsTable < ActiveRecord::Migration[7.2]
  def change
    create_table :result_attempts do |t|
      t.integer :value, null: false
      t.integer :attempt_number, null: false
      t.references :result, null: false
      t.index %i[result_id attempt_number], unique: true
      t.timestamps
    end
  end
end
