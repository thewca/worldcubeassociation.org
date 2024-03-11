# frozen_string_literal: true

class AddTreasurerToRoles < ActiveRecord::Migration[7.1]
  def change
    group = UserGroup.officers[0]
    wfc_leader = Team.wfc.leader
    metadata = RolesMetadataOfficers.create!(status: RolesMetadataOfficers.statuses[:treasurer])
    UserRole.create!(
      user_id: wfc_leader.user_id,
      group_id: group.id,
      start_date: wfc_leader.start_date,
      metadata: metadata,
    )
  end
end
