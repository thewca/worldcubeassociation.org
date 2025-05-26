# frozen_string_literal: true

namespace :schedule_activities do
  desc "Fill venue_room_id for child activities based on their parent activity"
  task backfill_venue_rooms: :environment do
    ScheduleActivity.where(venue_room_id: nil)
                    .find_each do |activity|
      puts "Updating activity #{activity.id}"

      activity.update_column(
        :venue_room_id,
        activity.root_activity.venue_room_id,
      )
    end
  end
end
