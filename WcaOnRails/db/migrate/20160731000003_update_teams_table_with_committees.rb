# frozen_string_literal: true
class UpdateTeamsTableWithCommittees < ActiveRecord::Migration
  def change
    add_reference :teams, :committee, index: true
    add_foreign_key :teams, :committees
    rename_column :teams, :friendly_id, :slug
    change_column_null :teams, :slug, false
    change_column_null :teams, :description, false

    add_index :teams, :name, unique: true
    add_index :teams, :slug, unique: true
  end
end
