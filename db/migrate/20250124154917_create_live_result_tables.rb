# frozen_string_literal: true

class CreateLiveResultTables < ActiveRecord::Migration[7.2]
  def change
    create_table :live_results do |t|
      t.references :registration, null: false, index: true
      t.references :round, null: false, index: true
      t.datetime :last_attempt_entered_at, null: false
      t.integer :ranking
      t.integer :best, null: false
      t.integer :average, null: false
      t.string :single_record_tag, limit: 255
      t.string :average_record_tag, limit: 255
      t.boolean :advancing, default: false, null: false
      t.boolean :advancing_questionable, default: false, null: false
      t.index [:registration_id, :round_id], unique: true
      t.timestamps
    end

    create_table :live_attempts do |t|
      t.integer :result, null: false
      t.integer :attempt_number, null: false
      t.references :replaced_by, foreign_key: { to_table: :live_attempts }
      t.datetime :entered_at, null: false
      t.references :entered_by, type: :integer, null: false, foreign_key: { to_table: :users }
      t.references :live_result, null: false
      t.timestamps
    end
  end
end
