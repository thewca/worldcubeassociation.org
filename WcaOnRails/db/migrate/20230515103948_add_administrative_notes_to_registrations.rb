# frozen_string_literal: true

class AddAdministrativeNotesToRegistrations < ActiveRecord::Migration[7.0]
  def change
    add_column :registrations, :administrative_notes, :text
  end
end
