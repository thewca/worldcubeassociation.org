# frozen_string_literal: true

class RenameAdvanceToNextRoundRequirementToAdvancementCondition < ActiveRecord::Migration[5.0]
  def change
    rename_column :rounds, :advance_to_next_round_requirement, :advancement_condition
  end
end
