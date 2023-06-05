# frozen_string_literal: true

class CreateStripePaymentIntentsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :stripe_payment_intents do |t|
      t.references :holder, polymorphic: true
      t.references :stripe_transaction, foreign_key: true
      t.text :client_secret
      t.text :error_details
      t.timestamps
      t.references :user, type: :integer, foreign_key: true
      t.datetime :confirmed_at
      t.references :confirmed_by, polymorphic: true
      t.datetime :canceled_at
      t.references :canceled_by, polymorphic: true
    end
  end
end
