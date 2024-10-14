# frozen_string_literal: true

require 'factory_bot_rails'

FactoryBot.define do
  factory :registration_request, class: Hash do
    transient do
      events { ['333', '333oh'] }
      raw_comment { nil }
    end

    user_id { nil }
    submitted_by { user_id }
    competition_id { nil }
    competing { { 'event_ids' => events, 'lane_state' => 'pending' } }

    jwt_token { fetch_jwt_token(submitted_by) }
    guests { 0 }

    trait :comment do
      competing { { 'event_ids' => events, 'comment' => raw_comment, 'lane_state' => 'pending' } }
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
    jwt_token { fetch_jwt_token(submitted_by) }
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

    initialize_with { attributes.stringify_keys }

    after(:build) do |instance, evaluator|
      instance['guests'] = evaluator.guests if evaluator.guests
      instance['competing'] = evaluator.competing if evaluator.competing
    end
  end
end
