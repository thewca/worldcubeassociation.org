# frozen_string_literal: true

class RenamePreregsToRegistrations < ActiveRecord::Migration
  def change
    rename_table :Preregs, :registrations
  end
end
