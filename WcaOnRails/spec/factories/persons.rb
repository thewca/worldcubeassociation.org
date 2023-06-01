# frozen_string_literal: true

FactoryBot.define do
  factory :person do
    wca_id do
      mid = ('A'..'Z').to_a.sample(4).join
      id = "2016#{mid}01"
      id = id.next while Person.exists?(wca_id: id)
      id
    end
    sub_id { 1 }
    name { Faker::Name.name }
    country_id { Country.real.sample.id }
    gender { "m" }
    dob { '1966-04-04' }

    trait :skip_validation do
      to_create { |res| res.save(validate: false) }
    end

    trait :missing_dob do
      dob { nil }
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
        FactoryBot.create :result, person: person, competition_id: competition.id
      end
    end
  end
end
