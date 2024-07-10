# frozen_string_literal: true

FactoryBot.define do
  factory :delegate_report do
    competition { FactoryBot.create :competition }

    trait :posted do
      schedule_url { 'http://example.com' }
      posted_at { Time.now }
      posted_by_user { FactoryBot.create(:user) }
    end

    initialize_with do
      competition.delegate_report
    end
  end
end
