# frozen_string_literal: true

class DropValueNsFromResults < ActiveRecord::Migration[8.1]
  def change
    change_table :results, bulk: true do |t|
      t.remove :value1, type: :integer, default: 0, null: false
      t.remove :value2, type: :integer, default: 0, null: false
      t.remove :value3, type: :integer, default: 0, null: false
      t.remove :value4, type: :integer, default: 0, null: false
      t.remove :value5, type: :integer, default: 0, null: false
    end
  end
end
