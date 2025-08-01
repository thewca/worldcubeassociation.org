# frozen_string_literal: true

class LinkPaymentIntentAndRegPayment < ActiveRecord::Migration[7.2]
  def change
    add_column :registration_payments, :payment_intent_id, :integer
  end
end
