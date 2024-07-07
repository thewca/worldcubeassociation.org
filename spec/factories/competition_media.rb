# frozen_string_literal: true

FactoryBot.define do
  factory :competition_medium do
    competition { FactoryBot.create(:competition) }
    type { 'article' }
    text { 'I am an article' }
    uri { 'https://www.example.com/article-42' }
    submitterName { Faker::Name.name }
    submitterComment { 'This is a comment' }
    submitterEmail { Faker::Internet.email }
    timestampSubmitted { 2.days.ago }
    timestampDecided { nil }
    status { 'pending' }

    trait :accepted do
      status { 'accepted' }
    end

    trait :pending do
      status { 'pending' }
    end
  end
end
