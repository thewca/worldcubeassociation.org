# frozen_string_literal: true

class AddDelegateRoles < ActiveRecord::Migration[7.1]
  def change
    User.where.not(delegate_status: nil).each do |user|
      UserRole.create!(
        user_id: user.id,
        group_id: user.read_attribute(:region_id),
        start_date: '2004-08-01',
        metadata: RolesMetadataDelegateRegions.create!(status: user.read_attribute(:delegate_status), location: user.read_attribute(:location)),
      )
    end
  end
end
