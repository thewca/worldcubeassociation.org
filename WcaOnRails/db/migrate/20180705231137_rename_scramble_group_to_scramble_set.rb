# frozen_string_literal: true

class RenameScrambleGroupToScrambleSet < ActiveRecord::Migration[5.2]
  def change
    rename_column :rounds, :scramble_group_count, :scramble_set_count
  end
end
