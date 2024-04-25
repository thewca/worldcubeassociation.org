# frozen_string_literal: true

class AddFriendlyIdToGroupsMetadataDelegateRegions < ActiveRecord::Migration[7.1]
  def change
    add_column :groups_metadata_delegate_regions, :friendly_id, :string
  end
end
