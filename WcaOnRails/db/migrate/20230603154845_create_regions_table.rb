# frozen_string_literal: true

class CreateRegionsTable < ActiveRecord::Migration[5.2]
  def change
    create_table :regions do |t|
      t.string :name, null: false
      t.string :friendly_id, null: false
      t.references :parent_region, null: true
      t.boolean :is_active, null: false
    end

    add_index :regions, :friendly_id

    Region.create(name: "Africa", friendly_id: "africa", is_active: true)
    Region.create(name: "Asia East", friendly_id: "asia-east", is_active: true)
    Region.create(name: "Asia Southeast", friendly_id: "asia-southeast", is_active: true)
    Region.create(name: "Asia West & South", friendly_id: "asia-west-south", is_active: true)
    Region.create(name: "Central Eurasia", friendly_id: "central-eurasia", is_active: true)
    Region.create(name: "Europe", friendly_id: "europe", is_active: true)
    Region.create(name: "Latin America", friendly_id: "latin-america", is_active: true)
    Region.create(name: "Oceania", friendly_id: "oceania", is_active: true)
    Region.create(name: "USA & Canada", friendly_id: "usa-canada", is_active: true)
  end
end
