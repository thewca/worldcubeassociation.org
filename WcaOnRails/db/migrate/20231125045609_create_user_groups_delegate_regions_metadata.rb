# frozen_string_literal: true

class CreateUserGroupsDelegateRegionsMetadata < ActiveRecord::Migration[7.0]
  def change
    create_table :user_groups_delegate_regions_metadata do |t|
      t.string :email
      t.timestamps
    end
  end
end
