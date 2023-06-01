# frozen_string_literal: true

FactoryBot.define do
  factory :scramble do
    event_id { "333" }
    round_type_id { "f" }
    group_id { "A" }
    is_extra { false }
    scramble_num { 1 }
    scramble { "R2 D2" }
  end
end
