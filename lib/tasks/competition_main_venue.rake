# frozen_string_literal: true

namespace :competition_main_venue do
  desc "Attempt to (somewhat) intelligently backlink competitions that don't have a main_venue yet"
  task backlink: :environment do
    Competition
      .includes(:competition_venues)
      .where(main_venue: nil, is_multi_location: false)
      .find_each do |competition|
        venue_count = competition.competition_venues.size
        is_multi_location = false

        if venue_count == 1
          # There is only one venue, so we can safely assume that it is our main venue
          main_venue = competition.competition_venues.first
        elsif venue_count.zero?
          # There is no venue at all, so this competition must be very old.
          # Let's build one from the legacy information that we have available!

          # assume the worst, if we cannot find the lat/long
          timezone = 'Etc/UTC'

          comp_latitude = competition.latitude_degrees
          comp_longitude = competition.longitude_degrees

          if comp_latitude.present? && comp_longitude.present?
            guessed_timezone = TZF.tz_name(comp_latitude, comp_longitude)
            timezone = guessed_timezone if guessed_timezone.present?
          end

          main_venue = competition.competition_venues.build(
            wcif_id: 1, # we know from the `if` above that there are no venues yet
            name: competition.venue,
            latitude_microdegrees: competition.latitude_microdegrees,
            longitude_microdegrees: competition.longitude_microdegrees,
            country_iso2: competition.country_iso2,
            timezone_id: timezone,
          )
        else
          is_multi_location = competition.fictive_country?
        end

        # Legacy data sometimes does not match modern WCIF conventions. Save anyways.
        main_venue.save(validate: false) if main_venue.present?

        competition.assign_attributes(main_venue: main_venue, is_multi_location: is_multi_location)

        if competition.changed?
          competition.save(validate: false)
          puts "Saved #{competition.id}"
        end
    end
  end

  desc "Fill in information from the competition description into the main venue (if present)"
  task backfill: :environment do
    Competition
      .includes(:main_venue)
      .where.not(main_venue: nil)
      .find_each do |competition|
      competition.main_venue.backfill_competition_info!

      if competition.main_venue.changed?
        puts "Updated information on #{competition.id}"
        competition.main_venue.save(validate: false)
      end
    end
  end
end
