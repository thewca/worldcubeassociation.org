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

  desc "Fill round_id for activities based on their activity code"
  task backfill_rounds: :environment do
    ScheduleActivity.where(round_id: nil)
                    .where.not("activity_code LIKE ?", "other%")
                    .find_each do |activity|
      puts "Updating activity #{activity.id} with code #{activity.activity_code}"

      parsed_ac = ScheduleActivity.parse_activity_code(activity.activity_code)

      competition = activity.venue_room.competition
      competition_event = competition.competition_events.find_by(event_id: parsed_ac[:event_id])

      if competition_event.blank?
        puts "Could not find event #{parsed_ac[:event_id]} in competition #{competition.id}!"
        next
      end

      matched_round = competition_event.rounds.find_by(number: parsed_ac[:round_number])

      if matched_round.blank?
        puts "Could not find round #{parsed_ac[:round_number]} for event #{parsed_ac[:event_id]} in competition #{competition.id}!"
        next
      end

      activity.update_column(
        :round_id,
        matched_round.id,
      )
    end
  end
end
