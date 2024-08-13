# frozen_string_literal: true

class August24MotionChangesWdc < ActiveRecord::Migration[7.1]
  def change
    legacy_wdc = GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wdc')

    legacy_wdc.user_group.active_roles.update_all(end_date: '2024-07-31')
    legacy_wdc.user_group.update!(is_active: false)

    wic_metadata = GroupsMetadataTeamsCommittees.create(
      email: 'integrity@worldcubeassociation.org',
      friendly_id: 'wic',
      preferred_contact_mode: 'email',
    )

    UserGroup.create!(
      name: 'WCA Integrity Committee',
      group_type: 'teams_committees',
      is_active: true,
      is_hidden: false,
      metadata: wic_metadata,
    )

    rename_column :delegate_reports, :wdc_incidents, :wic_incidents
    rename_column :delegate_reports, :wdc_feedback_requested, :wic_feedback_requested

    PostTag.where(tag: 'wdc').update_all(tag: 'wic')
  end
end
