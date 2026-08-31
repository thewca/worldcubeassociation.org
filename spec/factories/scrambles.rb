# frozen_string_literal: true

FactoryBot.define do
  factory :scramble do
    transient do
      format_id { "a" }
    end

    event_id { "333" }
    round_type_id { "f" }
    group_id { "A" }
    is_extra { false }
    scramble_num { 1 }
    scramble { "R2 D2" }

    competition { association(:competition, event_ids: [event_id]) }
    round { association(:round, competition: competition, event_id: event_id, format_id: format_id) }
  end
end
