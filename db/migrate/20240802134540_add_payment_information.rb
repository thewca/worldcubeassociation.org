# frozen_string_literal: true

class AddPaymentInformation < ActiveRecord::Migration[7.1]
  def change
    add_column :Competitions, :payment_information, :text
  end
end
