# frozen_string_literal: true

class AddUsesV2Registrations < ActiveRecord::Migration[7.0]
  def change
    add_column :Competitions, :uses_v2_registrations, :boolean, null: false, default: false
  end
end
