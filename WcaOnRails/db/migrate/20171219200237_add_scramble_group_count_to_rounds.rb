# frozen_string_literal: true

class AddScrambleGroupCountToRounds < ActiveRecord::Migration[5.1]
  def change
    add_column :rounds, :scramble_group_count, :integer, default: 1, null: false
  end
end
