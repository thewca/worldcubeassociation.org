# frozen_string_literal: true

class AddUserGroups < ActiveRecord::Migration[7.0]
  def change
    delegate_regions_user_group = UserGroup.create!(name: "Delegate Regions", group_type: :delegate_regions, is_active: true, is_hidden: false)
    User.find_each(delegate_status: "senior_delegate") do |delegate|
      region = delegate.location
      if region.include?("(")
        region = region[0, region.index("(")]
      end
      region = region.strip
      user_group = UserGroup.create!(name: region, group_type: :delegate_regions, parent_group_id: delegate_regions_user_group.id, is_active: true, is_hidden: false)
      delegate.region_id = user_group.id
      delegate.save!
      User.where(senior_delegate_id: delegate.id).update_all(region_id: user_group.id)
    end
  end
end
