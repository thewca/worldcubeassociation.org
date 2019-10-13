# frozen_string_literal: true

class CreateCountryBands < ActiveRecord::Migration[5.2]
  def change
    create_table :country_bands do |t|
      t.integer :number, null: false
      t.string :iso2, limit: 2, null: false
    end
    add_index :country_bands, :number
    add_index :country_bands, :iso2, unique: true
  end
end
