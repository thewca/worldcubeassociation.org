FactoryGirl.define do
  factory :competition do
    sequence(:name) { |n| "Foo Comp #{n} 2015" }

    cityName "San Francisco"
    countryId "USA"
    information "Information!"

    day = 1.year.ago
    start_date day.strftime("%F")
    end_date day.strftime("%F")

    eventSpecs "333 333oh"
    venue "My backyard"
    venueAddress "My backyard street"
    website "https://www.worldcubeassociation.org"
    showAtAll true

    trait :with_delegate do
      delegates { [ FactoryGirl.create(:delegate) ] }
    end

    trait :with_organizer do
      organizers { [ FactoryGirl.create(:user) ] }
    end

    use_wca_registration false
    registration_open 2.weeks.ago.change(usec: 0)
    registration_close 1.week.ago.change(usec: 0)

    trait :registration_open do
      use_wca_registration true
      registration_open 2.weeks.ago.change(usec: 0)
      registration_close 2.weeks.from_now.change(usec: 0)
    end

    factory :competition_with_delegates do
      after(:create) do |comp|
        comp.delegates << FactoryGirl.create(:delegate)
      end

      factory :confirmed_competition do
        after(:create) do |c|
          c.isConfirmed = true
          c.save!
        end
      end
    end
  end
end
