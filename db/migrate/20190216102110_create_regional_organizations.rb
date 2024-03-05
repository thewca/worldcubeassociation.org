# frozen_string_literal: true

class CreateRegionalOrganizations < ActiveRecord::Migration[5.2]
  def change
    create_table :regional_organizations do |t|
      t.string :name, null: false
      t.string :country, null: false
      t.string :website, null: false
      t.date :start_date, null: false
      t.date :end_date, default: nil

      t.timestamps
    end
    add_index :regional_organizations, :name
    add_index :regional_organizations, :country
  end
end
