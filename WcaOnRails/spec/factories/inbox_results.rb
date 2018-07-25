# frozen_string_literal: true

FactoryBot.define do
  factory :inbox_result do
    transient do
      competition { FactoryBot.create(:competition, :with_rounds, event_ids: ["333oh"]) }
      person { FactoryBot.create(:inbox_person, competitionId: competition) }
    end

    personId { person.id }
    pos 1
    competitionId { competition.id }
    eventId "333oh"
    roundTypeId "f"
    formatId "a"
    value1 { best }
    value2 { average }
    value3 { average }
    value4 { average }
    value5 { average }
    best 2000
    average 5000
  end
end
