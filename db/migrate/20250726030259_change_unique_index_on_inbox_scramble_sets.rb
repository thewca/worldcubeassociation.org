# frozen_string_literal: true

class ChangeUniqueIndexOnInboxScrambleSets < ActiveRecord::Migration[7.2]
  def change
    remove_index :inbox_scramble_sets, %i[competition_id event_id round_number scramble_set_number], unique: true
  end
end
