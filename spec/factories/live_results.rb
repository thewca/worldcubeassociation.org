# frozen_string_literal: true

FactoryBot.define do
  factory :live_result do
    registration
    round { FactoryBot.create(:round, event_id: '333oh', format_id: 'a') } # Ensure the round exists

    best { 3000 }
    average { 5000 }
    last_attempt_entered_at { Time.now.utc }

    locked_by_id { nil }
    quit_by_id { nil }

    transient do
      attempts_count { 5 }
    end

    before(:create) do |live_result, evaluator|
      live_result.live_attempts = build_list(:live_attempt, evaluator.attempts_count, live_result: live_result)
    end

    trait :mo3 do
      round { FactoryBot.create(:round, event_id: '666', format_id: 'm') }
      average { best }

      transient do
        attempts_count { 3 }
      end
    end

    trait :incomplete do
      transient do
        attempts_count { 3 }
      end
    end
  end
end
