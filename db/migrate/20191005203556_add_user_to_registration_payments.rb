# frozen_string_literal: true

class AddUserToRegistrationPayments < ActiveRecord::Migration[5.2]
  def change
    # Default for index is 'true', but we don't intend to search/access this table
    # by user. Default type is :bigint, whereas our users' id column is :integer.
    add_reference :registration_payments, :user, index: false, type: :integer
  end
end
