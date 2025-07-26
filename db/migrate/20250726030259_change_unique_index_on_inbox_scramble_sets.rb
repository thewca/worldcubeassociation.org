# frozen_string_literal: true

class ChangeUniqueIndexOnInboxScrambleSets < ActiveRecord::Migration[7.2]
  def change
    change_table :inbox_scramble_sets, bulk: true do |t|
      t.remove_index %i[competition_id event_id round_number scramble_set_number], unique: true
      t.index %i[competition_id event_id round_number ordered_index], unique: true
    end
  end
end
