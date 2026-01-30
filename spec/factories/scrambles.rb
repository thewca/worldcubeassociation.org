# frozen_string_literal: true

FactoryBot.define do
  factory :scramble do
    transient do
      competition { association(:competition, event_ids: ["333"]) }
      format_id { "a" }
    end

    competition_id { competition.id }
    event_id { "333" }
    round_type_id { "f" }
    group_id { "A" }
    is_extra { false }
    scramble_num { 1 }
    scramble { "R2 D2" }
    round { association(:round, competition: competition, event_id: event_id, format_id: format_id) }
  end
end
