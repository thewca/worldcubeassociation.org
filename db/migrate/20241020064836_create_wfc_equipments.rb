# frozen_string_literal: true

class CreateWfcEquipments < ActiveRecord::Migration[7.2]
  def change
    create_table :wfc_equipments do |t|
      t.string :name, null: false
      t.string :description, null: false
      t.bigint :price_in_usd, null: false
      t.string :brand, null: false
      t.boolean :in_stock_for_purchase, null: false, default: false
      t.timestamps
    end
  end
end
