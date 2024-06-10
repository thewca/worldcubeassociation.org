# frozen_string_literal: true

class RemoveTeams < ActiveRecord::Migration[7.1]
  def change
    drop_table :teams
  end
end
