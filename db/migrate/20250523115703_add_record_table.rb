# frozen_string_literal: true

class AddRecordTable < ActiveRecord::Migration[7.2]
  def change
    create_table :records do |t|
      t.string :record_type, null: false # 'single' or 'average'
      t.references :result, null: false, index: true
      t.integer :value, null: false
      t.string :event_id, null: false
      t.string :country_id
      t.string :continent_id
      t.string :record_timestamp, null: false
      t.string :record_scope, null: false, index: true # 'WR', 'CR', or 'NR'
      t.index %i[event_id record_type record_scope]
      t.index %i[event_id record_scope]
      t.index %i[country_id record_scope]
      t.timestamps
    end
  end
end
