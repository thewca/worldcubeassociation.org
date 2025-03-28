# frozen_string_literal: true

class RenameEventsColumns < ActiveRecord::Migration[7.2]
  def change
    rename_table :Events, :events
  end
end
