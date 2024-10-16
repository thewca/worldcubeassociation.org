# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Cachable do
  it "Reads only once when accessing a cached entity" do
    # Make sure the instances are not cached in memory from previous tests
    #   in which case there might be zero queries and the test could fail
    Country.models_by_id = nil

    assert_queries_count(1) {
      Country.c_find('USA')
      Country.c_find('USA')
    }
  end

  it "Reads twice when accessing a cached entity directly" do
    assert_queries_count(2) {
      Country.find('USA')
      Country.find('USA')
    }
  end

  it "Correctly invalidates caches when an entity is updated" do
    cached_usa = Country.c_find('USA')
    expect(cached_usa.name).to eq('United States')

    # Circumvent the cache on purpose
    usa = Country.find(cached_usa.id)
    usa.update!(name: "'Murica")

    # The method `name` is being overwritten by `localized_sortable` (grr...)
    #   so we need to directly read the raw underlying attribute
    expect(cached_usa.read_attribute(:name)).to eq("'Murica")
  end

  it "Correctly invalidates caches when a linked entity is updated" do
    cached_wst = GroupsMetadataTeamsCommittees.c_find('wst')

    wst_user_group = cached_wst.user_group
    expect(wst_user_group.name).to eq('WCA Software Team')

    # Circumvent the cache on purpose
    direct_user_group = UserGroup.find(wst_user_group.id)
    direct_user_group.update!(name: 'The one and only WST')

    # We updated an attribute through direct access, but the cache should still change
    #   This relies on configuring the AR association correctly with a `touch: true` or similar.
    expect(cached_wst.user_group.name).to eq('The one and only WST')
  end
end
