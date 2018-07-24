# frozen_string_literal: true

FactoryBot.define do
  factory :scramble do
    eventId { "333" }
    roundTypeId { "f" }
    groupId { "A" }
    isExtra { false }
    scrambleNum { 1 }
    scramble { "R2 D2" }
  end
end
