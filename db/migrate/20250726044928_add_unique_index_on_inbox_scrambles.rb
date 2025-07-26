# frozen_string_literal: true

class AddUniqueIndexOnInboxScrambles < ActiveRecord::Migration[7.2]
  def change
    add_index :inbox_scrambles, %i[inbox_scramble_set_id ordered_index], unique: true
  end
end
