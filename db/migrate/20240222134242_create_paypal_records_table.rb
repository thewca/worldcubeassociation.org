# frozen_string_literal: true

class CreatePaypalRecordsTable < ActiveRecord::Migration[7.1]
  def change
    create_table :paypal_records do |t|
      t.string :record_id
      t.string :status
      t.string :payload
      t.integer :amount_in_cents
      t.string :currency_code
      t.string :record_type

      t.references :parent_record, foreign_key: { to_table: :paypal_records }

      t.timestamps
    end
  end
end
