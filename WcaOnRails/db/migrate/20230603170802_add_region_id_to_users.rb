# frozen_string_literal: true

class AddRegionIdToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :region_id, :bigint
  end
end
