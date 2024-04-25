# frozen_string_literal: true

class CreateRegistrationPayments < ActiveRecord::Migration
  def change
    create_table :registration_payments do |t|
      t.integer :registration_id
      t.integer :amount_lowest_denomination
      t.string :currency_code
      t.string :stripe_charge_id
      t.datetime :refunded_at
      t.timestamps null: false
    end

    add_index :registration_payments, :stripe_charge_id
  end
end
