# frozen_string_literal: true

class CreateRolesMetadataDelegateRegions < ActiveRecord::Migration[7.1]
  def change
    create_table :roles_metadata_delegate_regions do |t|
      t.string :status
      t.string :location
      t.date :first_delegated
      t.date :last_delegated
      t.integer :total_delegated
      t.timestamps
    end
  end
end
