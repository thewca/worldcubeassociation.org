# frozen_string_literal: true

class AddIndexesToRegistrations < ActiveRecord::Migration[7.1]
  def change
    add_index :registrations, :user_id
  end
end
