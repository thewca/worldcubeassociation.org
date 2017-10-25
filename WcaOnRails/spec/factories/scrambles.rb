# frozen_string_literal: true

FactoryBot.define do
  factory :scramble do
    eventId "333"
    roundTypeId "f"
    groupId "a"
    isExtra false
    scrambleNum 0
    scramble "R2 D2"
  end
end
