# frozen_string_literal: true

class CreateStripePaymentIntentsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :stripe_payment_intents do |t|
      t.references :holder, polymorphic: true
      t.references :stripe_transaction, foreign_key: true
      t.text :client_secret
      t.timestamps
      t.references :user, type: :integer, foreign_key: true
      t.datetime :confirmed_at
      t.datetime :canceled_at
    end
  end
end
