# frozen_string_literal: true

FactoryBot.define do
  factory :contact_form do |f|
    f.name { "Jeremy" }
    f.your_email { "jeremy@example.com" }
    f.to_email { "to@example.com" }
    f.subject { "Subject" }
  end

  factory :website_contact do
    name { "Jon" }
    your_email { "jon@example.com" }

    transient do
      competition_contact { nil }
      competition_managers { [] }
    end

    trait :specific_competition_inquiry do
      inquiry { "competition" }
    end

    trait :general_competitions_inquiry do
      inquiry { "competitions_in_general" }
    end

    trait :with_invalid_competition_id do
      competition_id { "FooBar1900" }
    end

    trait :with_competition do
      competition_id { FactoryBot.create(:competition, :announced, contact: competition_contact, delegates: competition_managers).id }
    end
  end
end
