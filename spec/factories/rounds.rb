# frozen_string_literal: true

FactoryBot.define do
  factory :round do
    transient do
      event_id { "333" }
      format_id { "a" }
    end

    format { Format.c_find(format_id) }
    competition_event { association :competition_event, event_id: event_id }
    number { 1 }
    total_number_of_rounds { number }
  end
end
