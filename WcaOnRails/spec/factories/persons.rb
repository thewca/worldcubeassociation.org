FactoryGirl.define do
  factory :person do
    sequence :id do |n|
      "2005FLEI%02i" % n
    end
    subId 1
    name { Faker::Name.name }
    countryId { "USA" }
    gender "m"
    year 1966
    month 4
    day 4

    factory :person_with_multiple_sub_ids do
      after(:create) do |user|
        Person.create!(id: user.id, subId: user.subId + 1, countryId: "Israel")
      end
    end
  end
end
