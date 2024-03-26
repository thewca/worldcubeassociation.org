# frozen_string_literal: true

class MigrateCouncilsToUserGroups < ActiveRecord::Migration[7.1]
  def change
    all_councils = [Team.c_find_by_friendly_id!('wac')]
    all_councils.each do |council|
      metadata = GroupsMetadataCouncils.create!(email: council.email, friendly_id: council.friendly_id)
      UserGroup.create!(name: council.name, group_type: UserGroup.group_types[:councils], is_active: true, is_hidden: false, metadata: metadata)
    end
  end
end
