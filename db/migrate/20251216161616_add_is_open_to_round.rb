# frozen_string_literal: true

class AddIsOpenToRound < ActiveRecord::Migration[8.1]
  def change
    change_table :rounds, bulk: true do |t|
      t.boolean :is_open, default: true, null: false
    end
  end
end
