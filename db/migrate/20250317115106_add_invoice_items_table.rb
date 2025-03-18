# frozen_string_literal: true

class AddInvoiceItemsTable < ActiveRecord::Migration[7.2]
  def change
    create_table :invoice_items do |t|
      t.belongs_to :registration
      t.integer :amount_lowest_denomination
      t.string :currency_code
      t.integer :status
      t.string :display_name
    end
  end
end
