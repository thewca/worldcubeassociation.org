# frozen_string_literal: true

class CreateLiveResultTables < ActiveRecord::Migration[7.2]
  def change
    create_table :live_results do |t|
      t.references :registration, null: false, foreign_key: { to_table: :registrations }, index: true
      t.references :round, null: false, foreign_key: { to_table: :rounds }, index: true
      t.references :entered_by, null: false, foreign_key: { to_table: :users }
      t.datetime :entered_at, null: false
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

    create_table :live_attempts do |t|
      t.integer :result, null: false
      t.integer :attempt_number, null: false
      t.references :replaced_by, foreign_key: { to_table: :live_attempts }
      t.references :live_result, null: false, foreign_key: { to_table: :live_results }
      t.timestamps
    end
  end
end
