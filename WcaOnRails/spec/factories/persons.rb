# frozen_string_literal: true

FactoryBot.define do
  factory :person do
    wca_id do
      mid = ('A'..'Z').to_a.sample(4).join
      id = "2016#{mid}01"
      id = id.next while Person.exists?(wca_id: id)
      id
    end
    subId { 1 }
    name { Faker::Name.name }
    countryId { Country.real.sample.id }
    gender { "m" }
    year { 1966 }
    month { 4 }
    day { 4 }

    trait :skip_validation do
      to_create { |res| res.save(validate: false) }
    end

    trait :missing_dob do
      year { 0 }
      month { 0 }
      day { 0 }
    end

    trait :missing_gender do
      gender { "" }
    end

    factory :person_with_multiple_sub_ids do
      after(:create) do |person|
        name = person.name
        person.update!(name: "old name")
        person.update_using_sub_id!(name: name)
      end
    end

    factory :person_who_has_competed_once do
      after(:create) do |person|
        competition = FactoryBot.create(:competition, :with_delegate)
        FactoryBot.create :result, person: person, competitionId: competition.id
      end
    end
  end
end
