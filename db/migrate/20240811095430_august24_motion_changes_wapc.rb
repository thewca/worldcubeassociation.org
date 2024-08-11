# frozen_string_literal: true

class August24MotionChangesWapc < ActiveRecord::Migration[7.1]
  def change
    wapc_metadata = GroupsMetadataTeamsCommittees.create(
      email: 'appeals@worldcubeassociation.org',
      friendly_id: 'wapc',
      preferred_contact_mode: 'email',
    )

    UserGroup.create!(
      name: 'WCA Appeals Committee',
      group_type: 'teams_committees',
      is_active: true,
      is_hidden: false,
      metadata: wapc_metadata,
    )
  end
end
