# frozen_string_literal: true

class CreateRolesMetadataOfficers < ActiveRecord::Migration[7.1]
  def change
    create_table :roles_metadata_officers do |t|
      t.string :status
      t.timestamps
    end
  end
end
