# frozen_string_literal: true

class RenameOldRegistrationsToArchiveRegistrations < ActiveRecord::Migration[5.0]
  def change
    rename_table :old_registrations, :archive_registrations
  end
end
