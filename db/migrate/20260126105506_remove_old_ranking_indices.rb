# frozen_string_literal: true

class RemoveOldRankingIndices < ActiveRecord::Migration[8.1]
  def change
    change_table :results, bulk: true do |t|
      t.remove_index %i[event_id value1]
      t.remove_index %i[event_id value2]
      t.remove_index %i[event_id value3]
      t.remove_index %i[event_id value4]
      t.remove_index %i[event_id value5]
    end
  end
end
