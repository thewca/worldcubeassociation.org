# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserGroup, type: :model do
  let(:africa_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group }
  let(:asia_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group }
  let(:europe_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe').user_group }
  let(:oceania_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'oceania').user_group }
  let(:americas_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group }
  let(:asia_east_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-east').user_group }
  let(:asia_west_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-west').user_group }
  let(:india_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'india').user_group }
  let(:australia_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'australia').user_group }
  let(:delegate_roles) { FactoryBot.create_list(:delegate_role, 44) }
  let(:delegate_users) { delegate_roles.map(&:user) }

  before do
    delegate_roles[0..4].each do |role|
      role.update(group_id: africa_region.id)
    end
    delegate_roles[3..4].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[5..9].each do |role|
      role.update(group_id: asia_region.id)
    end
    delegate_roles[8..9].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[10..14].each do |role|
      role.update(group_id: europe_region.id)
    end
    delegate_roles[13..14].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[15..19].each do |role|
      role.update(group_id: oceania_region.id)
    end
    delegate_roles[18..19].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[20..24].each do |role|
      role.update(group_id: americas_region.id)
    end
    delegate_roles[23..24].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[25..29].each do |role|
      role.update(group_id: asia_east_region.id)
    end
    delegate_roles[28..29].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[30..34].each do |role|
      role.update(group_id: asia_west_region.id)
    end
    delegate_roles[33..34].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[35..38].each do |role|
      role.update(group_id: india_region.id)
    end
    delegate_roles[37..38].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[39..43].each do |role|
      role.update(group_id: australia_region.id)
    end
    delegate_roles[42..43].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
  end

  it "direct_child_groups has the direct child groups of the user group" do
    expect(asia_region.direct_child_groups).to eq([asia_east_region, asia_west_region])
  end

  it "child_groups has the child groups of the user group" do
    expect(asia_region.all_child_groups).to eq([asia_east_region, asia_west_region, india_region])
  end

  it "roles has the roles of the user group" do
    expect(asia_region.roles).to eq(delegate_roles[5..9])
  end

  it "active_roles has the active roles of the user group" do
    expect(asia_region.active_roles).to eq(delegate_roles[5..7])
  end

  it "roles_of_direct_child_groups has the roles of the direct child groups of the user group" do
    expect(asia_region.roles_of_direct_child_groups).to eq(delegate_roles[25..34])
  end

  it "roles_of_all_child_groups has the roles of the child groups of the user group" do
    expect(asia_region.roles_of_all_child_groups).to eq(delegate_roles[25..38])
  end

  it "active_roles_of_direct_child_groups has the active roles of the direct child groups of the user group" do
    expect(asia_region.active_roles_of_direct_child_groups).to eq(delegate_roles[25..27] + delegate_roles[30..32])
  end

  it "active_roles_of_all_child_groups has the active roles of the child groups of the user group" do
    expect(asia_region.active_roles_of_all_child_groups).to eq([
      delegate_roles[25..27],
      delegate_roles[30..32],
      delegate_roles[35..36],
    ].flatten)
  end

  it "users has the users of the user group" do
    expect(asia_region.users).to eq(delegate_users[5..9])
  end

  it "active_users has the active users of the user group" do
    expect(asia_region.active_users).to eq(delegate_users[5..7])
  end

  it "users_of_direct_child_groups has the users of the direct child groups of the user group" do
    expect(asia_region.users_of_direct_child_groups).to eq(delegate_users[25..34])
  end

  it "users_of_all_child_groups has the users of the child groups of the user group" do
    expect(asia_region.users_of_all_child_groups).to eq(delegate_users[25..38])
  end

  it "active_users_of_direct_child_groups has the active users of the direct child groups of the user group" do
    expect(asia_region.active_users_of_direct_child_groups).to eq(delegate_users[25..27] + delegate_users[30..32])
  end

  it "active_users_of_all_child_groups has the active users of the child groups of the user group" do
    expect(asia_region.active_users_of_all_child_groups).to eq([
      delegate_users[25..27],
      delegate_users[30..32],
      delegate_users[35..36],
    ].flatten)
  end

  it "is_root_group? returns true for root group" do
    expect(asia_region.is_root_group?).to eq(true)
  end

  it "is_root_group? returns false for non-root group" do
    expect(india_region.is_root_group?).to eq(false)
  end
end
