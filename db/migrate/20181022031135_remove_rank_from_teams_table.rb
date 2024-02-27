# frozen_string_literal: true

class RemoveRankFromTeamsTable < ActiveRecord::Migration[5.2]
  def change
    remove_column :teams, :rank, :integer
  end
end
