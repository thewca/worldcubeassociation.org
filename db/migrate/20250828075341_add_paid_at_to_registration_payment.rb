# frozen_string_literal: true

class AddPaidAtToRegistrationPayment < ActiveRecord::Migration[7.2]
  def change
    add_column :registration_payments, :paid_at, :datetime
  end
end
