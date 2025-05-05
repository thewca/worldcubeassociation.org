# frozen_string_literal: true

FactoryBot.define do
  factory :payment_intent do
    holder { FactoryBot.create(:registration) }
    payment_record { nil }
    initiated_by { holder.user }
    wca_status { 'pending' }

    trait :stripe do
      payment_record { FactoryBot.create(:stripe_record, :payment_intent) }
    end

    trait :canceled do
      canceled_at { DateTime.now }
      wca_status { 'canceled' }
      payment_record { FactoryBot.create(:stripe_record, :payment_intent, stripe_status: 'canceled') }
    end

    trait :confirmed do
      confirmed_at { DateTime.now }
      wca_status { 'succeeded' }
      payment_record { FactoryBot.create(:stripe_record, :payment_intent, stripe_status: 'succeeded') }
    end

    trait :not_started do
      payment_record { FactoryBot.create(:stripe_record, :payment_intent, :not_started) }
      wca_status { 'created' }
    end

    trait :manual do
      payment_record { FactoryBot.create(:manual_payment_record, competition: holder.competition) }
      wca_status { 'created' }
    end
  end
end
