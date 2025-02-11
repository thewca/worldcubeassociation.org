# frozen_string_literal: true

class CreateLiveRecordsTables < ActiveRecord::Migration[7.2]
  def change
    create_table :live_records do |t|
      t.string :record_type, null: false # 'single' or 'average'
      t.integer :value, null: false
      t.string :event_id, null: false
      t.string :country_id
      t.string :continent_id
      t.string :record_scope, null: false # 'WR', 'CR', or 'NR'
      t.index [:event_id, :record_type, :record_scope], unique: true
      t.timestamps
    end
  end
end
