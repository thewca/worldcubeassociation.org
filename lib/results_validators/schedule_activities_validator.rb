# frozen_string_literal: true

module ResultsValidators
  class ScheduleActivitiesValidator < GenericValidator
    ACTIVITY_OUTSIDE_COMPETITION_DATES_WARNING = :activity_outside_competition_dates_warning

    def self.description
      "This validator checks that the competition's schedule is consistent with the competition's remaining data."
    end

    def self.automatically_fixable?
      false
    end

    def competition_associations(check_real_results: false)
      {
        competition_venues: {
          venue_rooms: {
            schedule_activities: [],
          },
        },
      }
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition

        competition.competition_venues.each do |venue|
          timezone = venue.timezone_id

          venue.venue_rooms.each do |room|
            room.schedule_activities.each do |activity|
              local_start = activity.start_time.in_time_zone(timezone)
              local_end   = activity.end_time.in_time_zone(timezone)

              next unless local_start.to_date < competition.start_date ||
                          local_start.to_date > competition.end_date ||
                          local_end > (competition.end_date + 1).in_time_zone(timezone)

              @warnings << ValidationWarning.new(
                ACTIVITY_OUTSIDE_COMPETITION_DATES_WARNING,
                :schedule,
                competition.id,
                activity_name: activity.name,
                activity_code: activity.activity_code,
              )
            end
          end
        end
      end
    end
  end
end
