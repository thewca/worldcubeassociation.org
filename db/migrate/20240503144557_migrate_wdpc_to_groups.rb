# frozen_string_literal: true

class MigrateWdpcToGroups < ActiveRecord::Migration[7.1]
  include RoleMigrationHelper

  def change
    team = Team.find_by_friendly_id('wdpc')
    # email was removed in https://github.com/thewca/worldcubeassociation.org/pull/6065, but I don't
    # think there was any reason to remove it. Hence adding it back.
    metadata = GroupsMetadataTeamsCommittees.create!(email: 'dataprotection@worldcubeassociation.org', friendly_id: team.friendly_id)
    group = UserGroup.create!(name: team.name, group_type: UserGroup.group_types[:teams_committees], is_active: false, is_hidden: false, metadata: metadata)
    migrate_team_members_to_group(team, group)
  end
end
