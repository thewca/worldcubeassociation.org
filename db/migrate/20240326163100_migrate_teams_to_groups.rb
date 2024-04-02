# frozen_string_literal: true

class MigrateTeamsToGroups < ActiveRecord::Migration[7.1]
  def change
    all_official = [
      Team.wct,
      Team.wcat,
      Team.wdc,
      Team.wec,
      Team.weat,
      Team.wfc,
      Team.wmt,
      Team.wqac,
      Team.wrc,
      Team.wrt,
      Team.wst,
      Team.wsot,
      Team.wat,
    ]
    all_official.each do |team|
      metadata = GroupsMetadataTeamsCommittees.create!(email: team.email, friendly_id: team.friendly_id)
      UserGroup.create!(name: team.name, group_type: UserGroup.group_types[:teams_committees], is_active: true, is_hidden: false, metadata: metadata)
    end
  end
end
