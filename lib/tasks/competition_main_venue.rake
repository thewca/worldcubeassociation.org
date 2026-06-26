# frozen_string_literal: true

VENUE_ATTRIBUTES = [:venue, :city_name, :venue_address, :venue_details]

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

          main_venue = competition.competition_venues.build(
            # we know from the `if` above that there are no venues yet
            wcif_id: 1,
          )

          main_venue.backfill_competition_info!
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
  task :backfill, [:distance_km] => :environment do |_task, args|
    distance_km = args[:distance_km]&.to_f

    Competition
      .includes(:main_venue)
      .where.not(main_venue: nil)
      .find_each do |competition|
      competition.main_venue.backfill_competition_info!
      competition.main_venue.backfill_competition_coordinates!(distance_km)

      if competition.main_venue.changed?
        puts "Updated information on #{competition.id}"
        competition.main_venue.save(validate: false)
      end
    end
  end

  namespace :sanity_check do
    task :presence do
      Competition
        .includes(:main_venue)
        .find_each do |competition|
        if competition.main_venue.nil?
          puts "Should have a main venue but doesn't: #{competition.id}" unless competition.is_multi_location?
        else
          puts "Should NOT have a main venue but actually does: #{competition.id}" if competition.is_multi_location?
        end
      end
    end

    task :location do
      Competition
        .includes(:main_venue)
        .where.not(main_venue: nil)
        .find_each do |competition|
        competition.main_venue.backfill_competition_coordinates!

        if competition.main_venue.latitude_microdegrees_changed? || competition.main_venue.longitude_microdegrees_changed?
          competition.main_venue.restore_attributes
          haversine_distance = competition.main_venue.competition_distance_km

          puts "#{competition.id}: Distance #{haversine_distance.round(2)} km"
        end
      end
    end

    task :information do
      Competition
        .includes(:main_venue)
        .where.not(main_venue: nil)
        .find_each do |competition|
        competition.main_venue.backfill_competition_info!

        if competition.main_venue.changed?
          puts "#{competition.id}: Mismatch for attributes #{competition.main_venue.changes}"
        end
      end
    end
  end
end
