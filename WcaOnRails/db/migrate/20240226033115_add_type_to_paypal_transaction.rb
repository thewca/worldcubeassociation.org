# frozen_string_literal: true

class AddTypeToPaypalTransaction < ActiveRecord::Migration[7.1]
  def change
    add_column :paypal_transactions, :transaction_type, :string
  end
end
