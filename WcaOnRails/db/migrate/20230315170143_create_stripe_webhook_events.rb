# frozen_string_literal: true

class CreateStripeWebhookEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :stripe_webhook_events do |t|
      t.string :stripe_id
      t.string :event_type
      t.string :account_id
      t.boolean :handled
      t.references :stripe_transaction, foreign_key: true
      t.timestamps
    end
  end
end
