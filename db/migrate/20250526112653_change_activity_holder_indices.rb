# frozen_string_literal: true

class ChangeActivityHolderIndices < ActiveRecord::Migration[7.2]
  def change
    change_table :schedule_activities, bulk: true do |t|
      t.remove_index %i[holder_type holder_id]
      t.remove_index %i[holder_type holder_id wcif_id]

      t.change_null :holder_id, true
      t.change_null :holder_type, true
    end
  end
end
