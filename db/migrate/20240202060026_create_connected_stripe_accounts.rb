# frozen_string_literal: true

class CreateConnectedStripeAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :connected_stripe_accounts do |t|
      t.string :account_id

      t.timestamps
    end
  end
end
