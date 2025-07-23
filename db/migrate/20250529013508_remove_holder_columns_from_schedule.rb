# frozen_string_literal: true

class RemoveHolderColumnsFromSchedule < ActiveRecord::Migration[7.2]
  def change
    change_table :schedule_activities, bulk: true do |t|
      t.remove :holder_type, type: :string
      t.remove :holder_id, type: :bigint

      t.change_null :venue_room_id, false

      t.index %i[venue_room_id wcif_id], unique: true
    end
  end
end
