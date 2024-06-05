# frozen_string_literal: true

class CreateRolesMetadataBannedCompetitors < ActiveRecord::Migration[7.1]
  def change
    create_table :roles_metadata_banned_competitors do |t|
      t.string :ban_reason
      t.string :scope
      t.timestamps
    end
  end
end
