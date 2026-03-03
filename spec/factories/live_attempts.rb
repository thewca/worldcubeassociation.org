# frozen_string_literal: true

FactoryBot.define do
  factory :live_attempt do
    value { 3000 }
    attempt_number { 1 }

    trait :mbf do
      # 9 points in 4 minutes
      value { 900_024_000 }
    end

    trait :fm do
      value { 35 }
    end
  end
end
