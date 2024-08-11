# frozen_string_literal: true

class August24MotionChangesWec < ActiveRecord::Migration[7.1]
  def change
    legacy_wec = GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wec')

    legacy_wec.user_group.active_roles.update_all(end_date: Date.today)
    legacy_wec.user_group.update!(is_active: false)
  end
end
