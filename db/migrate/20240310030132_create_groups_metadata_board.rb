# frozen_string_literal: true

class CreateGroupsMetadataBoard < ActiveRecord::Migration[7.1]
  def change
    create_table :groups_metadata_board do |t|
      t.string :email
      t.timestamps
    end
  end
end
