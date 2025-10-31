# frozen_string_literal: true

class RemoveValueN < ActiveRecord::Migration[7.2]
  def change
    change_table :results, bulk: true do |t|
      t.remove :value1, type: :integer
      t.remove :value2, type: :integer
      t.remove :value3, type: :integer
      t.remove :value4, type: :integer
      t.remove :value5, type: :integer
    end
  end
end
