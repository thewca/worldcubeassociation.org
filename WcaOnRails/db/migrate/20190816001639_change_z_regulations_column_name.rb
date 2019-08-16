# frozen_string_literal: true

class ChangeZRegulationsColumnName < ActiveRecord::Migration[5.2]
  def change
    rename_column :Competitions, :regulation_z1, :early_puzzle_submission
    rename_column :Competitions, :regulation_z1_reason, :early_puzzle_submission_reason
    rename_column :Competitions, :regulation_z3, :qualification_results
    rename_column :Competitions, :regulation_z3_reason, :qualification_results_reason
  end
end
