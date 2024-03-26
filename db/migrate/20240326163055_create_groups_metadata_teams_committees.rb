# frozen_string_literal: true

class CreateGroupsMetadataTeamsCommittees < ActiveRecord::Migration[7.1]
  def change
    create_table :groups_metadata_teams_committees do |t|
      t.string :email
      t.string :friendly_id
      t.timestamps
    end
  end
end
