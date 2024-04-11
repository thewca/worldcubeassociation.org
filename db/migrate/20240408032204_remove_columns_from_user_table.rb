# frozen_string_literal: true

class RemoveColumnsFromUserTable < ActiveRecord::Migration[7.1]
  def change
    remove_column :users, :delegate_status
    remove_column :users, :region_id
    remove_column :users, :location
  end
end
