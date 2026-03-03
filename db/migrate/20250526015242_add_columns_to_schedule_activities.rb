# frozen_string_literal: true

class AddColumnsToScheduleActivities < ActiveRecord::Migration[7.2]
  def change
    change_table :schedule_activities, bulk: true do |t|
      t.references :venue_room, after: :holder_id, foreign_key: true
      t.references :parent_activity, after: :venue_room_id, foreign_key: { to_table: :schedule_activities }
      t.references :round, after: :activity_code, type: :integer, foreign_key: true
    end

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE schedule_activities
          SET venue_room_id = holder_id
          WHERE holder_type = 'VenueRoom'
        SQL

        execute <<~SQL.squish
          UPDATE schedule_activities
          SET parent_activity_id = holder_id
          WHERE holder_type = 'ScheduleActivity'
        SQL
      end
    end
  end
end
