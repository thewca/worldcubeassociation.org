# frozen_string_literal: true

class CreateLiveResultTables < ActiveRecord::Migration[7.2]
  def change
    create_table :live_results do |t|
      t.integer :person_id, null: false
      t.integer :round_id, null: false
      t.integer :entered_by_id, null: false
      t.timestamps
    end

    create_table :live_attempts do |t|
      t.integer :result, null: false
      t.integer :replaces
      t.references :live_result, foreign_key: { to_table: :live_results }, null: false
      t.timestamps
    end
  end
end
