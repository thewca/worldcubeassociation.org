# frozen_string_literal: true

class CreateRolesMetadataCouncils < ActiveRecord::Migration[7.1]
  def change
    create_table :roles_metadata_councils do |t|
      t.string :status
      t.timestamps
    end
  end
end
