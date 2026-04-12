# frozen_string_literal: true

class ChangeRoundIdToBigint < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :h2h_matches, :rounds
    remove_foreign_key :inbox_results, :rounds
    remove_foreign_key :inbox_scramble_sets, :rounds, column: :matched_round_id
    remove_foreign_key :results, :rounds
    remove_foreign_key :schedule_activities, :rounds
    remove_foreign_key :scrambles, :rounds

    reversible do |dir|
      dir.up do
        change_column :rounds, :id, :bigint

        change_column :h2h_matches, :round_id, :bigint
        change_column :inbox_results, :round_id, :bigint
        change_column :inbox_scramble_sets, :matched_round_id, :bigint
        change_column :results, :round_id, :bigint
        change_column :schedule_activities, :round_id, :bigint
        change_column :scrambles, :round_id, :bigint
      end

      dir.down do
        change_column :scrambles, :round_id, :integer
        change_column :schedule_activities, :round_id, :integer
        change_column :results, :round_id, :integer
        change_column :inbox_scramble_sets, :matched_round_id, :integer
        change_column :inbox_results, :round_id, :integer
        change_column :h2h_matches, :round_id, :integer

        change_column :rounds, :id, :integer
      end
    end

    add_foreign_key :h2h_matches, :rounds
    add_foreign_key :inbox_results, :rounds
    add_foreign_key :inbox_scramble_sets, :rounds, column: :matched_round_id
    add_foreign_key :results, :rounds
    add_foreign_key :schedule_activities, :rounds
    add_foreign_key :scrambles, :rounds

    # This one was already using `bigint` before, so now we can finally add the key
    add_foreign_key :live_results, :rounds
  end
end
