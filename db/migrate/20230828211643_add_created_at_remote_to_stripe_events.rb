# frozen_string_literal: true

class AddCreatedAtRemoteToStripeEvents < ActiveRecord::Migration[7.0]
  def change
    add_column :stripe_webhook_events, :created_at_remote, :datetime, after: :account_id, null: false
  end
end
