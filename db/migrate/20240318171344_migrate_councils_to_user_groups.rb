# frozen_string_literal: true

class MigrateCouncilsToUserGroups < ActiveRecord::Migration[7.1]
  def change
    wac = Team.c_find_by_friendly_id!('wac')
    metadata = GroupsMetadataCouncils.create!(email: wac.email, friendly_id: wac.friendly_id)
    UserGroup.create!(name: wac.name, group_type: UserGroup.group_types[:councils], is_active: true, is_hidden: false, metadata: metadata)
  end
end
