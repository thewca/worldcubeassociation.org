# frozen_string_literal: true

class CreateWfcXeroUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :wfc_xero_users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.boolean :is_combined_invoice, null: false, default: false
      t.timestamps
    end
  end
end
