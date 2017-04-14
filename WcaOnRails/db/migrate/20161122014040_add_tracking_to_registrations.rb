# frozen_string_literal: true

class AddTrackingToRegistrations < ActiveRecord::Migration
  def change
    add_column :registrations, :accepted_by, :integer
    add_column :registrations, :deleted_at, :datetime
    add_column :registrations, :deleted_by, :integer
  end
end
