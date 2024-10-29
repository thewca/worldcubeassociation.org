# frozen_string_literal: true

FactoryBot.define do
  factory :competition do
    transient do
      championship_types { [] }
      with_rounds { false }
      with_schedule { false }
      series_base { nil }
      series_distance_days { 0 }
      series_distance_km { 0 }
      distance_direction_deg { rand(360) }
      starts { 1.year.ago }
      ends { starts }
      event_ids { %w(333 333oh 555 pyram minx 222 444) }

      today { Time.now.utc.iso8601 }
      next_month { 1.month.from_now.iso8601 }
      last_year { 1.year.ago.iso8601 }

      qualifications { nil }

      hard_qualifications {
        {
          '333' => { 'type' => 'attemptResult', 'resultType' => 'single', 'whenDate' => today, 'level' => 1 },
          '555' => { 'type' => 'attemptResult', 'resultType' => 'average', 'whenDate' => today, 'level' => 6 },
          'pyram' => { 'type' => 'ranking', 'resultType' => 'single', 'whenDate' => (Time.now.utc-2).iso8601, 'level' => 1 },
          'minx' => { 'type' => 'ranking', 'resultType' => 'average', 'whenDate' => today, 'level' => 2 },
          '222' => { 'type' => 'anyResult', 'resultType' => 'single', 'whenDate' => today, 'level' => 0 },
          '444' => { 'type' => 'anyResult', 'resultType' => 'average', 'whenDate' => today, 'level' => 0 },
        }
      }

      easy_qualifications {
        {
          '333' => { 'type' => 'attemptResult', 'resultType' => 'single', 'whenDate' => today, 'level' => 1000 },
          '555' => { 'type' => 'attemptResult', 'resultType' => 'average', 'whenDate' => today, 'level' => 6000 },
          'pyram' => { 'type' => 'ranking', 'resultType' => 'single', 'whenDate' => (Time.now.utc-2).iso8601, 'level' => 100 },
          'minx' => { 'type' => 'ranking', 'resultType' => 'average', 'whenDate' => today, 'level' => 200 },
          '222' => { 'type' => 'anyResult', 'resultType' => 'single', 'whenDate' => today, 'level' => 0 },
          '444' => { 'type' => 'anyResult', 'resultType' => 'average', 'whenDate' => today, 'level' => 0 },
        }
      }

      easy_future_qualifications {
        {
          '333' => { 'type' => 'attemptResult', 'resultType' => 'single', 'whenDate' => next_month, 'level' => 1000 },
          '555' => { 'type' => 'attemptResult', 'resultType' => 'average', 'whenDate' => next_month, 'level' => 6000 },
          'pyram' => { 'type' => 'ranking', 'resultType' => 'single', 'whenDate' => next_month, 'level' => 100 },
          'minx' => { 'type' => 'ranking', 'resultType' => 'average', 'whenDate' => next_month, 'level' => 200 },
          '222' => { 'type' => 'anyResult', 'resultType' => 'single', 'whenDate' => next_month, 'level' => 0 },
          '444' => { 'type' => 'anyResult', 'resultType' => 'average', 'whenDate' => next_month, 'level' => 0 },
        }
      }

      past_qualifications {
        {
          '333' => { 'type' => 'attemptResult', 'resultType' => 'single', 'whenDate' => last_year, 'level' => 1000 },
          '555' => { 'type' => 'attemptResult', 'resultType' => 'average', 'whenDate' => last_year, 'level' => 6000 },
          'pyram' => { 'type' => 'ranking', 'resultType' => 'single', 'whenDate' => last_year, 'level' => 100 },
          'minx' => { 'type' => 'ranking', 'resultType' => 'average', 'whenDate' => last_year, 'level' => 200 },
          '222' => { 'type' => 'anyResult', 'resultType' => 'single', 'whenDate' => last_year, 'level' => 0 },
          '444' => { 'type' => 'anyResult', 'resultType' => 'average', 'whenDate' => last_year, 'level' => 0 },
        }
      }
    end

    sequence(:name) { |n| "Foo Comp #{n} 2015" }

    cityName { "San Francisco, California" }
    name_reason { "Foo sounds cool, right?" }
    countryId { "USA" }
    currency_code { "USD" }
    base_entry_fee_lowest_denomination { 1000 }
    information { "Information!" }
    latitude { rand(-90_000_000..90_000_000) }
    longitude { rand(-180_000_000..180_000_000) }

    use_wca_registration { false }
    registration_open { 54.weeks.ago.change(usec: 0) }
    registration_close { 53.weeks.ago.change(usec: 0) }

    start_date { starts.nil? ? nil : starts.strftime("%F") }
    end_date { ends.nil? ? nil : ends.strftime("%F") }

    events { Event.where(id: event_ids) }
    main_event_id { events.first.id if events.any? }

    venue { "My backyard" }
    venueAddress { "My backyard street" }
    external_website { "https://www.worldcubeassociation.org" }
    showAtAll { false }
    confirmed_at { nil }

    external_registration_page { "https://www.worldcubeassociation.org" }
    competitor_limit_enabled { false }
    guests_enabled { true }
    on_the_spot_registration { false }
    refund_policy_percent { 0 }
    guests_entry_fee_lowest_denomination { 0 }

    registration_version { :v1 }

    trait :enforces_qualifications do
      with_organizer
      qualification_results { true }
      qualification_results_reason { 'testing' }
      event_ids { %w(333 333oh 555 pyram minx 222 444) }
    end

    trait :enforces_easy_qualifications do
      enforces_qualifications
      allow_registration_without_qualification { false }

      transient do
        qualifications { easy_qualifications }
      end
    end

    trait :enforces_past_qualifications do
      enforces_qualifications
      allow_registration_without_qualification { false }

      transient do
        qualifications { past_qualifications }
      end
    end

    trait :enforces_hard_qualifications do
      enforces_qualifications
      allow_registration_without_qualification { false }

      transient do
        qualifications { hard_qualifications }
      end
    end

    trait :unenforced_easy_qualifications do
      enforces_qualifications
      allow_registration_without_qualification { true }

      transient do
        qualifications { easy_qualifications }
      end
    end

    trait :unenforced_hard_qualifications do
      enforces_qualifications
      allow_registration_without_qualification { true }

      transient do
        qualifications { hard_qualifications }
      end
    end

    trait :easy_future_qualifications do
      qualification_results { true }
      qualification_results_reason { 'testing' }
      event_ids { %w(333 333oh 555 pyram minx 222 444) }
      allow_registration_without_qualification { true }

      transient do
        qualifications { easy_future_qualifications }
      end
    end

    trait :future do
      starts { 2.weeks.from_now }
    end

    trait :payment_disconnect_delay_not_elapsed do
      starts { (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS).days.ago }
      ends { (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS-1).days.ago }
    end

    trait :payment_disconnect_delay_elapsed do
      starts { (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS+2).days.ago }
      ends { (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS+1).days.ago }
    end

    trait :ongoing do
      starts { Time.now }
    end

    trait :past do
      starts { 1.week.ago }
      ends { starts }
      registration_close { 2.weeks.ago.change(usec: 0) }
    end

    trait :results_posted do
      results_posted_at { Time.now }
      results_posted_by { FactoryBot.create(:user, :wrt_member).id }
    end

    trait :with_competitor_limit do
      competitor_limit_enabled { true }
      competitor_limit { 100 }
      competitor_limit_reason { "The hall only fits 100 competitors." }
    end

    trait :with_delegate do
      delegates { [FactoryBot.create(:delegate)] }
    end

    trait :with_trainee_delegate do
      delegates { [FactoryBot.create(:trainee_delegate)] }
    end

    trait :with_delegates_and_trainee_delegate do
      delegates { [FactoryBot.create(:delegate), FactoryBot.create(:trainee_delegate), FactoryBot.create(:delegate)] }
    end

    trait :with_organizer do
      organizers { [FactoryBot.create(:user)] }
    end

    trait :with_delegate_report do
      after(:create) do |competition|
        FactoryBot.create :delegate_report, :posted, competition: competition
      end
    end

    trait :with_guest_limit do
      guest_entry_status { Competition.guest_entry_statuses['restricted'] }
      guests_per_registration_limit { 10 }
    end

    # TODO: Analyze the tests that rely on this, and see if they can be rewritten in a more logical/less awkward way
    trait :with_meaningless_event_limit do
      event_ids { %w(333 333oh) }
      event_restrictions { true }
      event_restrictions_reason { "this is a favourites competition" }
      events_per_registration_limit { events.length }
    end

    trait :with_event_limit do
      event_restrictions { true }
      event_restrictions_reason { "this is a favourites competition" }
      events_per_registration_limit { events.length-2 }
    end

    trait :with_valid_submitted_results do
      announced
      with_rounds { true }
      results_submitted_at { Time.now }
      after(:create) do |competition|
        person = FactoryBot.create(:inbox_person, competitionId: competition.id)
        rounds = competition.competition_events.map(&:rounds).flatten
        rounds.each do |round|
          FactoryBot.create(:inbox_result, competitionId: competition.id, personId: person.id, eventId: round.event.id, formatId: round.format.id)
          FactoryBot.create_list(:scramble, 5, competitionId: competition.id, eventId: round.event.id)
        end
      end
    end

    trait :registration_open do
      starts { 1.month.from_now }
      ends { starts }
      registration_open { 2.weeks.ago.change(usec: 0) }
      registration_close { 2.weeks.from_now.change(usec: 0) }
      use_wca_registration { true }
    end

    trait :registration_closed do
      registration_open { 4.weeks.ago.change(usec: 0) }
      registration_close { 1.weeks.ago.change(usec: 0) }
      starts { 1.month.from_now }
      ends { starts }
    end

    trait :registration_not_opened do
      registration_open { 1.weeks.from_now.change(usec: 0) }
      registration_close { 4.weeks.from_now.change(usec: 0) }
      starts { 1.month.from_now }
      ends { starts }
    end

    trait :editable_registrations do
      allow_registration_edits { true }
      event_change_deadline_date { 2.weeks.from_now.change(usec: 0) }
    end

    trait :event_edit_passed do
      registration_closed
      allow_registration_edits { true }
      event_change_deadline_date { 1.day.ago }
    end

    trait :confirmed do
      with_delegate
      with_organizer
      with_valid_schedule
      confirmed_at { Time.now }
    end

    trait :not_visible do
      showAtAll { false }
    end

    trait :visible do
      with_delegate
      with_organizer
      showAtAll { true }
    end

    trait :announced do
      visible
      announced_at { start_date }
      announced_by { FactoryBot.create(:user, :wcat_member).id }
    end

    trait :cancelled do
      announced
      confirmed
      cancelled_at { Time.now }
      cancelled_by { FactoryBot.create(:user, :wcat_member).id }
    end

    trait :stripe_connected do
      # This is an actual test stripe account set up
      # for testing Stripe payments, and is connected
      # to the WCA Stripe account. For more information, see
      # https://github.com/thewca/worldcubeassociation.org/wiki/Payments-with-Stripe

      transient do
        stripe_account_id { 'acct_19ZQVmE2qoiROdto' }
      end
    end

    trait :paypal_connected do
      transient do
        paypal_merchant_id { '95XC2UKUP2CFW' }
      end
    end

    trait :accepts_donations do
      enable_donations { true }
    end

    trait :with_valid_schedule do
      with_rounds { true }
      with_schedule { true }
    end

    trait :world_championship do
      championship_types { ["world"] }
    end

    after(:build) do |competition, evaluator|
      if evaluator.series_base
        series_base = evaluator.series_base

        time_difference = evaluator.series_distance_days.days

        competition.start_date = series_base.start_date + time_difference
        competition.end_date = series_base.end_date + time_difference

        geo_distance_km = evaluator.series_distance_km.abs.to_f

        # haversine_shenanigans * rad_to_deg * deg_to_microdeg
        geo_distance_microdeg = (geo_distance_km / 6371) * (180 / Math::PI) * 1e6
        random_position_rad = evaluator.distance_direction_deg * (Math::PI / 180)

        distance_longitude = Math.cos(random_position_rad) * geo_distance_microdeg
        distance_latitude = Math.sin(random_position_rad) * geo_distance_microdeg

        competition.latitude = series_base.latitude + distance_latitude.to_i
        competition.longitude = series_base.longitude + distance_longitude.to_i
      end
    end

    after(:create) do |competition, evaluator|
      evaluator.championship_types.each do |championship_type|
        competition.championships.create!(championship_type: championship_type)
      end
      if evaluator.with_rounds
        competition.competition_events.each do |ce|
          ce.rounds.create!(
            format: ce.event.preferred_formats.first.format,
            number: 1,
            total_number_of_rounds: 1,
          )
        end
      end

      if evaluator.with_schedule
        # room id in wcif for a competition are unique, so we need to have a global counter
        current_room_id = 1
        2.times do |i|
          venue_attributes = {
            name: "Venue #{i+1}",
            wcif_id: i+1,
            country_iso2: competition.country.iso2,
            latitude_microdegrees: 123_456,
            longitude_microdegrees: 123_456,
            timezone_id: "Europe/Paris",
          }
          venue = competition.competition_venues.create!(venue_attributes)
          (i+1).times do |j|
            room_attributes = {
              wcif_id: current_room_id,
              name: "Room #{j+1} for venue #{i+1}",
            }
            current_room_id += 1
            venue.venue_rooms.create!(room_attributes)
          end
          if i == 0
            start_time = Time.zone.local_to_utc(competition.start_time)
            end_time = start_time
            venue.reload
            first_room = venue.venue_rooms.first
            first_room.schedule_activities.create!(
              wcif_id: 1,
              name: "Some name",
              activity_code: "other-lunch",
              start_time: start_time.change(hour: 12, min: 0, sec: 0).iso8601,
              end_time: end_time.change(hour: 13, min: 0, sec: 0).iso8601,
            )
            # In case we're generating multi days competition, add some activities
            # on the other day.
            start_time = Time.zone.local_to_utc(competition.end_date.to_time)
            end_time = start_time
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
        # Add valid schedule for existing rounds
        room = competition.competition_venues.last.venue_rooms.first
        current_activity_id = 1
        start_time = Time.zone.local_to_utc(competition.start_time)
        end_time = start_time
        competition.competition_events.each do |ce|
          ce.rounds.each do |r|
            room.schedule_activities.create!(
              wcif_id: current_activity_id,
              name: "Great round",
              activity_code: r.wcif_id,
              start_time: start_time.change(hour: 10, min: 30, sec: 0).iso8601,
              end_time: end_time.change(hour: 11, min: 0, sec: 0).iso8601,
            )
            current_activity_id += 1
          end
        end
      end

      if competition.qualification_results && evaluator&.qualifications&.present?
        events_wcif = competition.to_wcif['events']
        qualification_data = evaluator.qualifications

        events_wcif.each do |event|
          next unless qualification_data.keys.include?(event['id'])
          event['qualification'] = qualification_data[event['id']]
        end

        competition.set_wcif_events!(events_wcif, competition.organizers.first)
        competition.to_wcif['events']
      end

      if defined?(evaluator.stripe_account_id)
        stripe_account = ConnectedStripeAccount.new(account_id: evaluator.stripe_account_id)
        competition.competition_payment_integrations.new(connected_account: stripe_account)
        competition.save
      end

      if defined?(evaluator.paypal_merchant_id)
        paypal_account = ConnectedPaypalAccount.new(
          paypal_merchant_id: evaluator.paypal_merchant_id,
          permissions_granted: "PPCP",
          account_status: "test",
          consent_status: "test",
        )
        competition.competition_payment_integrations.new(connected_account: paypal_account)
        competition.save
      end
    end

    after(:create) do |competition| # TODO: This can be combined with the above after(:create) block
      create(:waiting_list, holder: competition)

      competition.delegates.each do |delegate|
        unless delegate.region_id.nil? # There can be cases where the competition delegate is actually not a delegate (temporary delegate)
          if UserGroup.find(delegate.region_id).lead_user.nil? # Allowing to manually create senior delegate for the delegate if needed.
            FactoryBot.create(:senior_delegate_role, group_id: delegate.region_id)
          end
        end
      end
    end
  end
end
