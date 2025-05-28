# frozen_string_literal: true

class ScramblesMatcherChangeRoundTypeToNumber < ActiveRecord::Migration[7.2]
  def change
    change_table :inbox_scramble_sets, bulk: true do |t|
      t.integer :round_number, null: false, after: :round_type_id # rubocop:disable Rails/NotNullColumn

      t.remove_index %i[competition_id event_id round_type_id scramble_set_number], unique: true
      t.remove_index %i[competition_id event_id round_type_id]

      t.index %i[competition_id event_id round_number]
    end
  end
end
