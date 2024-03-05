# frozen_string_literal: true

class AddReceiptToRegistrationPayments < ActiveRecord::Migration[7.0]
  def change
    add_reference :registration_payments, :receipt, polymorphic: true, index: true, after: :currency_code
  end
end
