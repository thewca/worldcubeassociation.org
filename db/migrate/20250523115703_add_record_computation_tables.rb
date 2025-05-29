# frozen_string_literal: true

class AddRecordComputationTables < ActiveRecord::Migration[7.2]
  def change
    create_table :regional_records do |t|
      t.string :record_type, null: false # 'single' or 'average'
      t.references :result, null: false, index: true
      t.integer :value, null: false
      t.references :event, type: :string, foreign_key: true, index: true
      t.references :country, type: :string, foreign_key: true, index: true
      t.references :continent, type: :string, foreign_key: true, index: true
      t.date :record_timestamp, null: false
      t.integer :record_scope, null: false, index: true
      t.index %i[event_id record_type record_scope]
      t.index %i[event_id record_scope]
      t.index %i[country_id record_scope]
      t.timestamps
    end

    create_table :result_timestamps do |t|
      t.references :result, null: false, index: { unique: true }
      t.references :event, type: :string, foreign_key: true, index: true
      t.references :country, type: :string, foreign_key: true, index: true
      t.references :continent, type: :string, foreign_key: true, index: true
      t.integer :best
      t.integer :average
      t.date :round_timestamp, null: false
      t.index %i[event_id round_timestamp best]
      t.index %i[event_id round_timestamp average]
      t.timestamps
    end
  end
end
