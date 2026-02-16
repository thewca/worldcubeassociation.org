# frozen_string_literal: true

class AddIsCapturedToRegPayment < ActiveRecord::Migration[7.2]
  def change
    add_column :registration_payments, :is_completed, :boolean, default: true, null: false
  end
end
