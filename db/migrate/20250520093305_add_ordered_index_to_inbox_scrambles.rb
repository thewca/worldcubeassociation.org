# frozen_string_literal: true

class AddOrderedIndexToInboxScrambles < ActiveRecord::Migration[7.2]
  def change
    rename_column :inbox_scramble_sets, :matched_round_ordered_index, :ordered_index

    reversible do |dir|
      dir.up do
        change_column :inbox_scramble_sets, :ordered_index, :integer, null: false, after: :scramble_set_number
      end

      dir.down do
        change_column :inbox_scramble_sets, :ordered_index, :integer, after: :matched_round_id
      end
    end

    add_column :inbox_scrambles, :ordered_index, :integer, null: false, after: :scramble_number # rubocop:disable Rails/NotNullColumn
  end
end
