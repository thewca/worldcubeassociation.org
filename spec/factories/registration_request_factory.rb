# frozen_string_literal: true

require 'factory_bot_rails'

FactoryBot.define do
  factory :registration_request, class: Hash do
    transient do
      events { ['333', '333oh'] }
      raw_comment { nil }
    end


    user_id { 158817 }
    submitted_by { user_id }
    competition_id { 'CubingZANationalChampionship2023' }
    competing { { 'event_ids' => events, 'lane_state' => 'pending' } }

    jwt_token { fetch_jwt_token(submitted_by) }
    guests { 0 }

    trait :comment do
      competing { { 'event_ids' => events, 'comment' => raw_comment, 'lane_state' => 'pending' } }
    end

    trait :organizer do
      user_id { 1306 }
      jwt_token { fetch_jwt_token(user_id) }
    end

    trait :organizer_submits do
      submitted_by { 1306 }
    end

    trait :impersonation do
      transient do
        other_user { FactoryBot.create(:user) }
      end

      submitted_by { other_user.id }
    end

    trait :banned do
      user_id { 209943 }
    end

    trait :unbanned_soon do
      user_id { 209944 }
    end

    trait :incomplete do
      user_id { 999999 }
    end

    initialize_with { attributes.stringify_keys }
  end
end
