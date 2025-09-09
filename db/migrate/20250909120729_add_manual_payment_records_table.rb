# frozen_string_literal: true

class AddManualPaymentRecordsTable < ActiveRecord::Migration[7.2]
  def change
    create_table :manual_payment_records do |t|
      t.string :payment_reference
      t.string :manual_status, null: false
      t.integer :amount_iso_denomination, null: false
      t.string :currency_code, null: false
      t.timestamps
    end
  end
end
