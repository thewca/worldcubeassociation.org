# frozen_string_literal: true

FactoryBot.define do
  factory :competition do
    sequence(:name) { |n| "Foo Comp #{n} 2015" }

    cityName "San Francisco"
    countryId "USA"
    currency_code "USD"
    base_entry_fee_lowest_denomination 1000
    information "Information!"
    registration_requirements "Requirements"
    latitude { rand(-90_000_000..90_000_000) }
    longitude { rand(-180_000_000..180_000_000) }

    transient do
      starts 1.year.ago
      ends { starts }
      event_ids { %w(333 333oh) }
    end

    start_date { starts.nil? ? nil : starts.strftime("%F") }
    end_date { ends.nil? ? nil : ends.strftime("%F") }

    trait :future do
      starts 1.week.from_now
    end

    trait :ongoing do
      starts Time.now
    end

    trait :past do
      starts 1.week.ago
    end

    trait :results_posted do
      results_posted_at Time.now
    end

    trait :with_competitor_limit do
      competitor_limit_enabled true
      competitor_limit 100
      competitor_limit_reason "The hall only fits 100 competitors."
    end

    events { Event.where(id: event_ids) }

    venue "My backyard"
    venueAddress "My backyard street"
    external_website "https://www.worldcubeassociation.org"
    showAtAll false
    isConfirmed false

    guests_enabled true

    trait :with_delegate do
      delegates { [FactoryBot.create(:delegate)] }
    end

    trait :with_organizer do
      organizers { [FactoryBot.create(:user)] }
    end

    trait :with_delegate_report do
      after(:create) do |competition|
        FactoryBot.create :delegate_report, :posted, competition: competition
      end
    end

    use_wca_registration false
    registration_open 2.weeks.ago.change(usec: 0)
    registration_close 1.week.ago.change(usec: 0)

    trait :registration_open do
      use_wca_registration true
      registration_open 2.weeks.ago.change(usec: 0)
      registration_close 2.weeks.from_now.change(usec: 0)
    end

    trait :confirmed do
      with_delegate
      isConfirmed true
    end

    trait :not_visible do
      showAtAll false
    end

    trait :visible do
      with_delegate
      showAtAll true
    end

    trait :stripe_connected do
      # This is an actual test stripe account set up
      # for testing Stripe payments, and is connected
      # to the WCA Stripe account. For more information, see
      # https://github.com/thewca/worldcubeassociation.org/wiki/Payments-with-Stripe
      connected_stripe_account_id "acct_19ZQVmE2qoiROdto"
    end

    transient do
      championship_types []
      with_schedule false
    end

    after(:create) do |competition, evaluator|
      evaluator.championship_types.each do |championship_type|
        competition.championships.create!(championship_type: championship_type)
      end
      if evaluator.with_schedule
        2.times do |i|
          venue_attributes = {
            name: "Venue #{i+1}",
            wcif_id: i+1,
            latitude_microdegrees: 123_456,
            longitude_microdegrees: 123_456,
            timezone_id: "Europe/Paris",
          }
          venue = competition.competition_venues.create!(venue_attributes)
          (i+1).times do |j|
            room_attributes = {
              wcif_id: j+1,
              name: "Room #{j+1} for venue #{i+1}",
            }
            venue.venue_rooms.create!(room_attributes)
          end
          if i == 0
            start_time = competition.start_date.to_datetime
            end_time = competition.start_date.to_datetime
            venue.reload
            first_room = venue.venue_rooms.first
            first_room.schedule_activities.create!(
              wcif_id: 1,
              name: "Some name",
              activity_code: "other-lunch",
              start_time: start_time.change(hour: 12, min: 0, sec: 0).iso8601,
              end_time: end_time.change(hour: 13, min: 0, sec: 0).iso8601,
            )
            activity = first_room.schedule_activities.create!(
              wcif_id: 2,
              name: "another activity",
              activity_code: "333fm-r1",
              start_time: start_time.change(hour: 10, min: 0, sec: 0).iso8601,
              end_time: end_time.change(hour: 11, min: 0, sec: 0).iso8601,
            )
            activity.child_activities.create!(
              wcif_id: 3,
              name: "first group",
              activity_code: "333fm-r1-g1",
              start_time: start_time.change(hour: 10, min: 0, sec: 0).iso8601,
              end_time: end_time.change(hour: 10, min: 30, sec: 0).iso8601,
            )
            nested_activity = activity.child_activities.create!(
              wcif_id: 4,
              name: "second group",
              activity_code: "333fm-r1-g2",
              start_time: start_time.change(hour: 10, min: 30, sec: 0).iso8601,
              end_time: end_time.change(hour: 11, min: 0, sec: 0).iso8601,
            )
            nested_activity.child_activities.create!(
              wcif_id: 5,
              name: "some nested thing",
              activity_code: "333fm-r1-g2-a1",
              start_time: start_time.change(hour: 10, min: 30, sec: 0).iso8601,
              end_time: end_time.change(hour: 11, min: 0, sec: 0).iso8601,
            )
          end
        end
      end
    end
  end
end
