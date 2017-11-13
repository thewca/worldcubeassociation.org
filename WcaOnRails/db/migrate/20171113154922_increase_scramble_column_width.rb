# frozen_string_literal: true

class IncreaseScrambleColumnWidth < ActiveRecord::Migration[5.1]
  def change
    change_column :Scrambles, :scramble, :text
  end
end
