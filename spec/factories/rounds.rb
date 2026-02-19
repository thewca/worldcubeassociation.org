# frozen_string_literal: true

FactoryBot.define do
  factory :round do
    transient do
      competition { nil }
      event_id { "333" }
      format_id { "a" }
    end

    format { Format.c_find(format_id) }
    competition_event { competition&.competition_events&.find_or_create_by(event_id: event_id) || (association :competition_event, event_id: event_id) }
    number { 1 }
    total_number_of_rounds { number }
    linked_round { nil }
  end
end
