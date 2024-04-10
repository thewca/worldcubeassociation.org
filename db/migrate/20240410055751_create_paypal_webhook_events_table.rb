# frozen_string_literal: true

class CreatePaypalWebhookEventsTable < ActiveRecord::Migration[7.1]
  def change
    create_table :paypal_webhook_events do |t|
      t.string :paypal_id
      t.string :event_type
      t.string :event_version
      t.string :merchant_id
      t.datetime :created_at_remote
      t.text :paypal_headers
      t.boolean :handled
      t.references :paypal_record, foreign_key: true
      t.timestamps
    end
  end
end
