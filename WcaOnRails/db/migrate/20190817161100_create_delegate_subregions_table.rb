# frozen_string_literal: true

class CreateDelegateSubregionsTable < ActiveRecord::Migration[5.2]
  def change
    create_table :delegate_subregions do |t|
      t.string :name, null: false
      t.references :delegate_region, null: false
      t.string :friendly_id, null: false
    end

    add_index :delegate_subregions, :friendly_id

    DelegateSubregion.create(name: 'Canada', friendly_id: 'canada', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'California, USA', friendly_id: 'california_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'Mid-Atlantic, USA', friendly_id: 'mid_atlantic_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'Midwest, USA', friendly_id: 'midwest_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'New England, USA', friendly_id: 'new_england_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'Pacific Northwest, USA', friendly_id: 'pacific_northwest_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'Rockies, USA', friendly_id: 'rockies_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'South, USA', friendly_id: 'south_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'Southeast, USA', friendly_id: 'southeast_usa', delegate_region: DelegateRegion.usa_canada)
    DelegateSubregion.create(name: 'Brazil', friendly_id: 'brazil', delegate_region: DelegateRegion.latin_america)
    DelegateSubregion.create(name: 'Central America', friendly_id: 'central_america', delegate_region: DelegateRegion.latin_america)
    DelegateSubregion.create(name: 'South America (Central)', friendly_id: 'south_america_central', delegate_region: DelegateRegion.latin_america)
    DelegateSubregion.create(name: 'South America (North)', friendly_id: 'south_america_north', delegate_region: DelegateRegion.latin_america)
    DelegateSubregion.create(name: 'South America (South)', friendly_id: 'south_america_south', delegate_region: DelegateRegion.latin_america)
  end
end
