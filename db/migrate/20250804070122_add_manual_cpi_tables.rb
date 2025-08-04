# frozen_string_literal: true

class AddManualCpiTables < ActiveRecord::Migration[7.2]
  def change
    create_table :manual_payment_integrations do |t|
      t.string :payment_reference, null: false
      t.text :payment_information, null: false
      t.timestamps
    end

    create_table :manual_payment_records do |t|
      t.string :payment_reference
      t.integer :amount_iso_denomination, null: false
      t.string :currency_code, null: false
      t.timestamps
    end
  end
end
