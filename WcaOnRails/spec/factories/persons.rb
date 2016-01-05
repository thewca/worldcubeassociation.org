FactoryGirl.define do
  factory :person do
    sequence :id do |n|
      "%04iFLEI%02i" % [2003 + (n / 100), n % 100]
    end
    subId 1
    name { Faker::Name.name }
    countryId { "USA" }
    gender "m"
    year 1966
    month 4
    day 4

    factory :person_with_multiple_sub_ids do
      after(:create) do |person|
        Person.create!(id: person.id, subId: person.subId + 1, countryId: "Israel")
      end
    end

    factory :person_who_has_competed_once do
      after(:create) do |person|
        competition = FactoryGirl.create :competition
        competition =  FactoryGirl.create(:competition, :with_delegate)
        FactoryGirl.create :result, person: person, competitionId: competition.id
        FactoryGirl.create :result, person: person, competitionId: competition.id
      end
    end
  end
end
