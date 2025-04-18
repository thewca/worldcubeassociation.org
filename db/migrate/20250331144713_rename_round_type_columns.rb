# frozen_string_literal: true

class RenameRoundTypeColumns < ActiveRecord::Migration[7.2]
  def change
    change_table :RoundTypes do |t|
      t.rename :cellName, :cell_name
    end

    rename_table :RoundTypes, :round_types
  end
end
