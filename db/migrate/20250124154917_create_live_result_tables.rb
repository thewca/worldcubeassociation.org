# frozen_string_literal: true

class CreateLiveResultTables < ActiveRecord::Migration[7.2]
  def change
    create_table :live_results do |t|
      t.integer :registration_id, null: false
      t.integer :round_id, null: false
      t.integer :entered_by_id, null: false
      t.integer :ranking
      t.integer :best, null: false
      t.integer :average, null: false
      t.string :single_record_tag, limit: 255
      t.string :average_record_tag, limit: 255
      t.boolean :advancing, default: false, null: false
      t.boolean :advancing_questionable, default: false, null: false
      t.timestamps
    end

    add_index :live_results, [:registration_id, :round_id], unique: true
    add_index :live_results, :round_id
    add_index :live_results, :registration_id

    create_table :live_attempts do |t|
      t.integer :result, null: false
      t.integer :attempt_number, null: false
      t.references :replaces, foreign_key: { to_table: :live_attempts }
      t.references :live_result, foreign_key: { to_table: :live_results }
      t.timestamps
    end
  end
end
