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
    website "https://www.worldcubeassociation.org"
    showAtAll true
  end
end
