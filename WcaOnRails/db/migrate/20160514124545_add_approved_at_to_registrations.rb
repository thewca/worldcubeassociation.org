# frozen_string_literal: true

class AddApprovedAtToRegistrations < ActiveRecord::Migration
  def change
    add_column :Preregs, :accepted_at, :datetime
  end
end
