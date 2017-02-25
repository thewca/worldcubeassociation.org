# frozen_string_literal: true
FactoryGirl.define do
  factory :competition do
    sequence(:name) { |n| "Foo Comp #{n} 2015" }

    cityName "San Francisco"
    countryId "USA"
    information "Information!"
    latitude { rand(-90_000_000..90_000_000) }
    longitude { rand(-180_000_000..180_000_000) }

    transient do
      starts 1.year.ago
      ends { starts }
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

    events { Event.where(id: %w(333 333oh)) }

    venue "My backyard"
    venueAddress "My backyard street"
    external_website "https://www.worldcubeassociation.org"
    showAtAll false
    isConfirmed false

    guests_enabled true

    trait :with_delegate do
      delegates { [FactoryGirl.create(:delegate)] }
    end

    trait :with_organizer do
      organizers { [FactoryGirl.create(:user)] }
    end

    trait :with_delegate_report do
      after(:create) do |competition|
        FactoryGirl.create :delegate_report, :posted, competition: competition
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

    trait :entry_fee do
      base_entry_fee_lowest_denomination 1000
      currency_code "AUD"
      # This is an actual test stripe account set up
      # for testing Stripe payments, and is connected
      # to the WCA Stripe account. For more inforamtion, see
      # https://github.com/thewca/worldcubeassociation.org/wiki/Payments-with-Stripe
      connected_stripe_account_id "acct_19ZQVmE2qoiROdto"
    end
  end
end
