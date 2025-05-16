# frozen_string_literal: true

class ChangeIndicesOnScrambleSets < ActiveRecord::Migration[7.2]
  def change
    change_table :inbox_scramble_sets, bulk: true do |t|
      t.rename :ordered_index, :scramble_set_number
      t.integer :matched_round_ordered_index, after: :matched_round_id
    end
  end
end
