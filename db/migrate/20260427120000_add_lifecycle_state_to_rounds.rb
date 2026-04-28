class AddLifecycleStateToRounds < ActiveRecord::Migration[8.1]
  def up
    add_column :rounds, :lifecycle_state, :string, limit: 10, null: false, default: "pending"

    Round.joins(:competition).where.not(competitions: { results_submitted_at: nil }).update_all(lifecycle_state: "done")

    Round.joins(:competition).where(competitions: { results_submitted_at: nil }).find_each do |round|
      round.update_columns(lifecycle_state: round.inferred_lifecycle_state)
    end
  end

  def down
    remove_column :rounds, :lifecycle_state
  end
end
