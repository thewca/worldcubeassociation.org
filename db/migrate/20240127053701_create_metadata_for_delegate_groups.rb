# frozen_string_literal: true

class CreateMetadataForDelegateGroups < ActiveRecord::Migration[7.1]
  def change
    UserGroup.delegate_region_groups.each do |region|
      if region.metadata.blank?
        ActiveRecord::Base.transaction do
          metadata = GroupsMetadataDelegateRegions.create!(friendly_id: region.name.parameterize)
          region.update!(metadata: metadata)
        end
      end
    end
  end
end
