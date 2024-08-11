# frozen_string_literal: true

class August24MotionChangesWdc < ActiveRecord::Migration[7.1]
  def change
    legacy_wdc = GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wdc')

    legacy_wdc.update!(friendly_id: 'wic', email: 'integrity@worldcubeassociation.org')
    legacy_wdc.user_group.update!(name: 'WCA Integrity Committee')

    rename_column :delegate_reports, :wdc_incidents, :wic_incidents
    rename_column :delegate_reports, :wdc_feedback_requested, :wic_feedback_requested

    PostTag.where(tag: 'wdc').update_all(tag: 'wic')
  end
end
