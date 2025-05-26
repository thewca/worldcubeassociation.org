# frozen_string_literal: true

class AddRecordComputationTables < ActiveRecord::Migration[7.2]
  def change
    create_table :regional_records do |t|
      t.string :record_type, null: false # 'single' or 'average'
      t.references :result, null: false, index: true
      t.integer :value, null: false
      t.string :event_id, null: false
      t.string :country_id
      t.string :continent_id
      t.date :record_timestamp, null: false
      t.integer :record_scope, null: false, index: true
      t.index %i[event_id record_type record_scope]
      t.index %i[event_id record_scope]
      t.index %i[country_id record_scope]
      t.timestamps
    end

    create_table :result_timestamps do |t|
      t.references :result, null: false, index: { unique: true }
      t.date :round_timestamp, null: false
      t.index %i[result_id round_timestamp]
      t.timestamps
    end
  end
end
