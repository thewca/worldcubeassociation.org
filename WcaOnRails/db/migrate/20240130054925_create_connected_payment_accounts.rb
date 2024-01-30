# frozen_string_literal: true

class CreateConnectedPaymentAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :connected_payment_accounts do |t|
      t.references :connected_account, polymorphic: true, null: false
      t.references :competition, null: false

      t.timestamps
    end
  end
end
