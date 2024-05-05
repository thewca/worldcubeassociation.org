# frozen_string_literal: true

class AddHiddenToTeams < ActiveRecord::Migration[5.2]
  def change
    add_column :teams, :hidden, :boolean, null: false, default: false
    Team.update_all hidden: false
  end
end
