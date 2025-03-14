# frozen_string_literal: true

class AddModelsForInvoiceSupport < ActiveRecord::Migration[7.2]
  def change
    create_table  :invoices do
      t.bigint :owner_id
      t.string :owner_type
      t.integer :status
    end

    create_table  :invoice_items do
      t.belongs_to :invoice_id
      t.bigint :productable_id
      t.string :productable_type
      t.integer :amount
      t.integer :status
      t.string :display_name
    t.
    end

    create_table  :competition_products do
      t.belongs_to :competition_id
      t.integer :type
    end
  end
end
