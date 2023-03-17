# frozen_string_literal: true

class RestructureStripeChargesTable < ActiveRecord::Migration[7.0]
  def change
    rename_table :stripe_charges, :stripe_transactions

    change_table :stripe_transactions do |t|
      t.string :api_type, after: :id
      t.rename :stripe_charge_id, :stripe_id
      t.rename :metadata, :parameters
      t.integer :amount_stripe_denomination, after: :stripe_id, null: true
      t.string :currency_code, after: :amount_stripe_denomination, null: true
      t.references :parent_transaction, foreign_key: { to_table: :stripe_transactions }
      t.string :account_id, after: :error
    end
  end
end
