# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserGroup, type: :model do
  let(:delegate_region_americas) { FactoryBot.create(:delegate_region_americas) }
  let(:delegate_region_asia_pacific) { FactoryBot.create(:delegate_region_asia_pacific) }
  let(:delegate_region_europe) { FactoryBot.create(:delegate_region_europe) }
  let(:delegate_region_middle_east_africa) { FactoryBot.create(:delegate_region_middle_east_africa) }
  let(:delegate_region_usa) { FactoryBot.create(:delegate_region_usa) }
  let(:delegate_region_california) { FactoryBot.create(:delegate_region_california) }
  let(:delegate_region_texas) { FactoryBot.create(:delegate_region_texas) }
  let(:delegate_region_florida) { FactoryBot.create(:delegate_region_florida) }
  let(:delegate_roles) { FactoryBot.create_list(:delegate_role, 40) }
  let(:delegate_users) { delegate_roles.map(&:user) }

  before do
    delegate_region_california.update(parent_group_id: delegate_region_usa.id)
    delegate_region_texas.update(parent_group_id: delegate_region_usa.id)
    delegate_region_florida.update(parent_group_id: delegate_region_usa.id)
    delegate_region_usa.update(parent_group_id: delegate_region_americas.id)
    delegate_roles[0..4].each do |role|
      role.update(group_id: delegate_region_americas.id)
    end
    delegate_roles[3..4].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[5..9].each do |role|
      role.update(group_id: delegate_region_asia_pacific.id)
    end
    delegate_roles[8..9].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[10..14].each do |role|
      role.update(group_id: delegate_region_europe.id)
    end
    delegate_roles[13..14].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[15..19].each do |role|
      role.update(group_id: delegate_region_middle_east_africa.id)
    end
    delegate_roles[18..19].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[20..24].each do |role|
      role.update(group_id: delegate_region_usa.id)
    end
    delegate_roles[23..24].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[25..29].each do |role|
      role.update(group_id: delegate_region_california.id)
    end
    delegate_roles[28..29].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[30..34].each do |role|
      role.update(group_id: delegate_region_texas.id)
    end
    delegate_roles[33..34].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
    delegate_roles[35..39].each do |role|
      role.update(group_id: delegate_region_florida.id)
    end
    delegate_roles[38..39].each do |role|
      role.update(end_date: Date.today - 1.day)
    end
  end

  it 'direct_child_groups has the direct child groups of the user group' do
    expect(delegate_region_americas.direct_child_groups).to eq([delegate_region_usa])
  end

  it 'child_groups has the child groups of the user group' do
    expect(delegate_region_americas.all_child_groups).to eq(
      [
        delegate_region_usa,
        delegate_region_california,
        delegate_region_texas,
        delegate_region_florida,
      ],
    )
  end

  it 'roles has the roles of the user group' do
    expect(delegate_region_americas.roles).to eq(delegate_roles[0..4])
  end

  it 'active_roles has the active roles of the user group' do
    expect(delegate_region_americas.active_roles).to eq(delegate_roles[0..2])
  end

  it 'roles_of_direct_child_groups has the roles of the direct child groups of the user group' do
    expect(delegate_region_americas.roles_of_direct_child_groups).to eq(delegate_roles[20..24])
  end

  it 'roles_of_all_child_groups has the roles of the child groups of the user group' do
    expect(delegate_region_americas.roles_of_all_child_groups).to eq(delegate_roles[20..39])
  end

  it 'active_roles_of_direct_child_groups has the active roles of the direct child groups of the user group' do
    expect(delegate_region_americas.active_roles_of_direct_child_groups).to eq(delegate_roles[20..22])
  end

  it 'active_roles_of_all_child_groups has the active roles of the child groups of the user group' do
    expect(delegate_region_americas.active_roles_of_all_child_groups).to eq([
      delegate_roles[20..22],
      delegate_roles[25..27],
      delegate_roles[30..32],
      delegate_roles[35..37],
    ].flatten)
  end

  it 'users has the users of the user group' do
    expect(delegate_region_americas.users).to eq(delegate_users[0..4])
  end

  it 'active_users has the active users of the user group' do
    expect(delegate_region_americas.active_users).to eq(delegate_users[0..2])
  end

  it 'users_of_direct_child_groups has the users of the direct child groups of the user group' do
    expect(delegate_region_americas.users_of_direct_child_groups).to eq(delegate_users[20..24])
  end

  it 'users_of_all_child_groups has the users of the child groups of the user group' do
    expect(delegate_region_americas.users_of_all_child_groups).to eq(delegate_users[20..39])
  end

  it 'active_users_of_direct_child_groups has the active users of the direct child groups of the user group' do
    expect(delegate_region_americas.active_users_of_direct_child_groups).to eq(delegate_users[20..22])
  end

  it 'active_users_of_all_child_groups has the active users of the child groups of the user group' do
    expect(delegate_region_americas.active_users_of_all_child_groups).to eq([
      delegate_users[20..22],
      delegate_users[25..27],
      delegate_users[30..32],
      delegate_users[35..37],
    ].flatten)
  end
end
