# frozen_string_literal: true

class RenamePaypalRecordColumns < ActiveRecord::Migration[7.1]
  def change
    rename_column :paypal_records, :record_id, :paypal_id
    rename_column :paypal_records, :record_type, :paypal_record_type

    change_column :paypal_records, :amount_in_cents, :string
    rename_column :paypal_records, :amount_in_cents, :amount_paypal_denomination

    change_column :paypal_records, :payload, :text, null: false
    rename_column :paypal_records, :payload, :parameters

    change_column :paypal_records, :paypal_status, :string, null: false

    add_column :paypal_records, :merchant_id, :string
    add_column :paypal_records, :created_at_remote, :datetime
    add_column :paypal_records, :updated_at_remote, :datetime

    rename_column :stripe_records, :parent_transaction_id, :parent_record_id
  end
end
