# frozen_string_literal: true

class RenameAdministrativeNoteToOrganizerComment < ActiveRecord::Migration[7.2]
  def change
    rename_column :registrations, :administrative_notes, :organizer_comment
  end
end
