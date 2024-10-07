# frozen_string_literal: true

class CreateRolesMetadataTeamsCommittees < ActiveRecord::Migration[7.1]
  def change
    create_table :roles_metadata_teams_committees do |t|
      t.string :status
      t.timestamps
    end
  end
end
