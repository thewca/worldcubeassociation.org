# frozen_string_literal: true

class August24MotionChangesWac < ActiveRecord::Migration[7.1]
  def change
    legacy_wac = GroupsMetadataCouncils.find_by(friendly_id: 'wac')

    legacy_wac.user_group.active_roles.update_all(end_date: Date.today)
    legacy_wac.user_group.update!(is_active: false)
  end
end
