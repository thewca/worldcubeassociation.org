# frozen_string_literal: true

class LinkPaymentIntentAndRegPayment < ActiveRecord::Migration[7.2]
  def change
    add_reference :registration_payments, :payment_intent,  foreign_key: true
  end
end
