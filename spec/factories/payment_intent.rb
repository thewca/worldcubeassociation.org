# frozen_string_literal: true

FactoryBot.define do
  factory :payment_intent do
    holder { FactoryBot.create(:registration) }
    payment_record { FactoryBot.create(:stripe_record, :payment_intent) }
    initiated_by { FactoryBot.create(:user) }

    trait :canceled do
      canceled_at { DateTime.now }
    end

    trait :confirmed do
      confirmed_at { DateTime.now }
    end

    trait :not_started do
      payment_record { FactoryBot.create(:stripe_record, :payment_intent, :not_started) }
    end
  end
end
