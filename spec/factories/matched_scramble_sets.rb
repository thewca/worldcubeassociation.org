# frozen_string_literal: true

FactoryBot.define do
  factory :matched_scramble_set do
    transient do
      event_id { "333" }
      format_id { "a" }
    end

    ordered_index { 0 }

    round { association(:round, event_id: event_id, format_id: format_id) }
  end
end
