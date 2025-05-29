# frozen_string_literal: true

class RemoveScramblesMatcherRoundTypeId < ActiveRecord::Migration[7.2]
  def change
    change_table :inbox_scramble_sets, bulk: true do |t|
      t.remove_foreign_key :round_types
      t.remove :round_type_id, type: :string

      t.index %i[competition_id event_id round_number scramble_set_number], unique: true
    end
  end
end
