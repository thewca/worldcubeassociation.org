# frozen_string_literal: true

class MigrateSeniorsToRoles < ActiveRecord::Migration[7.1]
  def change
    ActiveRecord::Base.transaction do
      User.where(delegate_status: 'senior_delegate').each do |senior_delegate|
        region = UserGroup.find(senior_delegate.region_id)
        raise "Region not found for senior_delegate: #{senior_delegate.name}" unless region

        metadata = RolesMetadataDelegateRegions.create!(status: RolesMetadataDelegateRegions.statuses[:senior_delegate])
        UserRole.create!(
          user_id: senior_delegate.id,
          group_id: senior_delegate.region_id,
          start_date: Date.today - 10.years, # For now, making the start date as 10 years before for everyone. Jacob will update the correct start date for each senior delegate after migration.
          metadata: metadata,
        )
        senior_delegate.update!(delegate_status: 'delegate')
      end
    end
  end
end
