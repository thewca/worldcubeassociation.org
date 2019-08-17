# frozen_string_literal: true

class CreateDelegateRegionsTable < ActiveRecord::Migration[5.2]
  def change
    create_table :delegate_regions do |t|
      t.string :name, null: false
      t.string :friendly_id, null: false
      t.boolean :is_active, null: false
    end

    add_index :delegate_regions, :friendly_id

    DelegateRegion.create(name: 'Africa', friendly_id: 'africa', is_active: true)
    DelegateRegion.create(name: 'Asia East', friendly_id: 'asia_east', is_active: true)
    DelegateRegion.create(name: 'Asia Japan', friendly_id: 'asia_japan', is_active: true)
    DelegateRegion.create(name: 'Asia Southeast', friendly_id: 'asia_southeast', is_active: true)
    DelegateRegion.create(name: 'Asia West & India', friendly_id: 'asia_west_india', is_active: true)
    DelegateRegion.create(name: 'Europe East & Middle East', friendly_id: 'europe_east_middle_east', is_active: true)
    DelegateRegion.create(name: 'Europe North & Baltic States', friendly_id: 'europe_north_baltic_states', is_active: true)
    DelegateRegion.create(name: 'Europe West', friendly_id: 'europe_west', is_active: true)
    DelegateRegion.create(name: 'Latin America', friendly_id: 'latin_america', is_active: true)
    DelegateRegion.create(name: 'Oceania', friendly_id: 'oceania', is_active: true)
    DelegateRegion.create(name: 'USA & Canada', friendly_id: 'usa_canada', is_active: true)
    DelegateRegion.create(name: 'USA East & Canada', friendly_id: 'usa_east_canada', is_active: false)
    DelegateRegion.create(name: 'USA West', friendly_id: 'usa_west', is_active: false)
    DelegateRegion.create(name: 'World', friendly_id: 'world', is_active: false)
  end
end
