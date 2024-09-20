# frozen_string_literal: true

class AddRawRecordResultsTable < ActiveRecord::Migration[7.2]
  def change
    create_table :auxiliary_raw_records do |t|
      t.references :result, type: :integer, null: false, foreign_key: { to_table: :Results }
      t.string :type, null: false
      t.integer :value, null: false
      t.string :record_name, null: false
    end
  end
end
