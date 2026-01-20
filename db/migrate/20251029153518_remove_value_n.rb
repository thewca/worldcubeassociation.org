# frozen_string_literal: true

class RemoveValueN < ActiveRecord::Migration[7.2]
  def change
    change_table :results, bulk: true do |t|
      t.remove_index %i[event_id value1]
      t.remove_index %i[event_id value2]
      t.remove_index %i[event_id value3]
      t.remove_index %i[event_id value4]
      t.remove_index %i[event_id value5]

      t.remove :value1, type: :integer
      t.remove :value2, type: :integer
      t.remove :value3, type: :integer
      t.remove :value4, type: :integer
      t.remove :value5, type: :integer
    end
  end
end
