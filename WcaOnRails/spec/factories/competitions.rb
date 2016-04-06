FactoryGirl.define do
  factory :competition do
    sequence(:name) { |n| "Foo Comp #{n} 2015" }

    cityName "San Francisco"
    countryId "USA"
    information "Information!"

    transient do
      starts 1.year.ago
      ends { starts }
    end

    start_date { starts.strftime("%F") }
    end_date { ends.strftime("%F") }

    eventSpecs "333 333oh"
    venue "My backyard"
    venueAddress "My backyard street"
    website "https://www.worldcubeassociation.org"
    showAtAll true

    guests_enabled true

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

    trait :confirmed do
      with_delegate
      isConfirmed true
    end
  end
end
