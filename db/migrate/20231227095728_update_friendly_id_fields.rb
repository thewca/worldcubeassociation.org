# frozen_string_literal: true

class UpdateFriendlyIdFields < ActiveRecord::Migration[7.1]
  def change
    UserGroup.delegate_regions.each do |region|
      email = region.metadata.email
      region.metadata.update!(
        friendly_id: email.split('@').first.split('.').second,
      )
    end
  end
end
