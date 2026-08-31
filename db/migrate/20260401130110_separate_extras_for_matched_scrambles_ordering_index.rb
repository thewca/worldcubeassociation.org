# frozen_string_literal: true

class SeparateExtrasForMatchedScramblesOrderingIndex < ActiveRecord::Migration[8.1]
  def change
    change_table :matched_scrambles, bulk: true do |t|
      t.remove_index %i[matched_scramble_set_id ordered_index], name: :ordering_sequence, unique: true
      t.index %i[matched_scramble_set_id is_extra ordered_index], name: :ordering_sequence, unique: true
    end
  end
end
