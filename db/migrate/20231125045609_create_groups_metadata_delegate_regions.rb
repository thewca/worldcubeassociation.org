# frozen_string_literal: true

class CreateGroupsMetadataDelegateRegions < ActiveRecord::Migration[7.0]
  def change
    create_table :groups_metadata_delegate_regions do |t|
      t.string :email
      t.timestamps
    end
  end
end
