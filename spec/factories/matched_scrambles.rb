# frozen_string_literal: true

FactoryBot.define do
  factory :matched_scramble do
    transient do
      event_id { "333" }
      format_id { "a" }
    end

    ordered_index { 0 }

    is_extra { false }
    scramble_string { "R2 D2" }

    matched_scramble_set { association(:matched_scramble_set, event_id: event_id, format_id: format_id) }
  end
end
