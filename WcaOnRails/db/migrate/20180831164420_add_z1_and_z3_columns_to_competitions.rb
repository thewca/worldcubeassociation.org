# frozen_string_literal: true

class AddZ1AndZ3ColumnsToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :regulation_z1, :boolean, null: true, default: nil
    add_column :Competitions, :regulation_z1_reason, :text, null: true, default: nil

    add_column :Competitions, :regulation_z3, :boolean, null: true, default: nil
    add_column :Competitions, :regulation_z3_reason, :text, null: true, default: nil
  end
end
