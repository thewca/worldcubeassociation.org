# frozen_string_literal: true

class ToggleGuests < ActiveRecord::Migration
  def change
    rename_column :Preregs, :guests, :guests_old
    reversible do |dir|
      dir.up do
        change_column :Preregs, :guests_old, :text, null: true
      end
      dir.down do
        change_column :Preregs, :guests_old, :text, null: false
      end
    end

    add_column :Preregs, :guests, :integer, null: false, default: 0
    add_column :Competitions, :guests_enabled, :boolean, null: false, default: false
  end
end
