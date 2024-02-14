# frozen_string_literal: true

class CreateConnectedPaypalAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :connected_paypal_accounts do |t|
      t.string :paypal_merchant_id
      t.string :permissions_granted
      t.string :account_status
      t.string :consent_status

      t.timestamps
    end
  end
end
