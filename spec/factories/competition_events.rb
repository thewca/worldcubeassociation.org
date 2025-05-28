# frozen_string_literal: true

FactoryBot.define do
  factory :competition_event do
    competition { association :competition, event_ids: [event_id] }
    event_id { "333" }
    fee_lowest_denomination { 0 }
  end
end
