# frozen_string_literal: true

require 'factory_bot_rails'

FactoryBot.define do
  factory :registration_request, class: Hash do
    transient do
      events { %w[333 333oh] }
      raw_comment { nil }
    end

    user_id { nil }
    submitted_by { user_id }
    competition_id { nil }
    competing { { 'event_ids' => events, 'competing_status' => 'pending' } }

    guests { 0 }

    trait :comment do
      competing { { 'event_ids' => events, 'comment' => raw_comment, 'competing_status' => 'pending' } }
    end

    trait :impersonation do
      transient do
        other_user { FactoryBot.create(:user) }
      end

      submitted_by { other_user.id }
    end

    trait :banned do
      user_id { nil }
    end

    trait :unbanned_soon do
      user_id { nil }
    end

    trait :incomplete do
      user_id { nil }
    end

    initialize_with { attributes.stringify_keys }
  end

  factory :update_request, class: Hash do
    user_id { nil }
    submitted_by { user_id }

    competition_id { nil }

    transient do
      competing { nil }
      guests { nil }
    end

    trait :for_another_user do
      transient do
        other_user { FactoryBot.create(:user) }
      end

      submitted_by { other_user.id }
    end

    trait :organizer_for_user do
      transient do
        other_user { FactoryBot.create(:user) }
      end

      submitted_by { other_user.id }
    end

    initialize_with { attributes.compact.stringify_keys }

    after(:build) do |instance, evaluator|
      instance['guests'] = evaluator.guests if evaluator.guests
      instance['competing'] = evaluator.competing if evaluator.competing
    end
  end

  factory :bulk_update_request, class: Hash do
    transient do
      user_ids { [] }
    end

    submitted_by { nil }
    competition_id { nil }

    requests do
      user_ids.map do |user_id|
        FactoryBot.build(:update_request, user_id: user_id, competing: { 'status' => 'cancelled' })
      end
    end

    initialize_with { attributes.stringify_keys }
  end
end
