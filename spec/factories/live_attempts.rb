# frozen_string_literal: true

FactoryBot.define do
  factory :live_attempt do
    result { 3000 }
    attempt_number { 1 }

    trait :mbf do
      # 9 points in 4 minutes
      result { 900_024_000 }
    end

    trait :fm do
      result { 35 }
    end
  end
end
