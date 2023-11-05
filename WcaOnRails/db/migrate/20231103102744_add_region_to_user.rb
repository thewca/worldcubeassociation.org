# frozen_string_literal: true

class AddRegionToUser < ActiveRecord::Migration[7.0]
  def change
    add_reference :users, :region, foreign_key: { to_table: :user_groups }, after: :delegate_status
  end
end
