class AddLifecycleStateToRounds < ActiveRecord::Migration[7.2]
  def up
    add_column :rounds, :lifecycle_state, :string, limit: 10, null: false, default: "pending"

    Round.reset_column_information
    Round.find_each do |round|
      round.update_columns(lifecycle_state: round.inferred_lifecycle_state)
    end
  end

  def down
    remove_column :rounds, :lifecycle_state
  end
end
