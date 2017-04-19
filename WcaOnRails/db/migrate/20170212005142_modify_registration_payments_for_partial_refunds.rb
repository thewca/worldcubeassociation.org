# frozen_string_literal: true

class ModifyRegistrationPaymentsForPartialRefunds < ActiveRecord::Migration
  def change
    add_column :registration_payments, :refunded_registration_payment_id, :int
    remove_column :registration_payments, :refunded_at, :datetime

    add_index :registration_payments, :refunded_registration_payment_id, name: "idx_reg_payments_on_refunded_registration_payment_id"
  end
end
