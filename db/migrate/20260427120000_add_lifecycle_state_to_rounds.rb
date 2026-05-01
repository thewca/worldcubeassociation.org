# frozen_string_literal: true

class AddLifecycleStateToRounds < ActiveRecord::Migration[8.1]
  def up
    add_column :rounds, :lifecycle_state, :integer, null: false, default: 0

    Round.joins(:competition).where.not(competitions: { results_submitted_at: nil }).update_all(lifecycle_state: Round::STATE_INTEGERS["done"])

    Round.joins(:competition).where(competitions: { results_submitted_at: nil }).find_each do |round|
      round.update_columns(lifecycle_state: round.inferred_lifecycle_state)
    end
  end

  def down
    remove_column :rounds, :lifecycle_state
  end
end
