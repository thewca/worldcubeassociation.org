class AddRoundResultsToRounds < ActiveRecord::Migration[5.1]
  def change
    add_column :rounds, :round_results, :mediumtext
  end
end
