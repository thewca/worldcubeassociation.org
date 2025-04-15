# frozen_string_literal: true

FactoryBot.define do
  factory :competition_medium do
    competition { FactoryBot.create(:competition) }
    media_type { "article" }
    text { "I am an article" }
    uri { "https://www.example.com/article-42" }
    submitter_name { Faker::Name.name }
    submitter_comment { "This is a comment" }
    submitter_email { Faker::Internet.email }
    submitted_at { 2.days.ago }
    decided_at { nil }
    status { "pending" }

    trait :accepted do
      status { "accepted" }
    end

    trait :pending do
      status { "pending" }
    end
  end
end
