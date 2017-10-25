# frozen_string_literal: true

FactoryBot.define do
  factory :result do
    transient do
      person { FactoryBot.create(:person) }
      competition { FactoryBot.create(:competition) }
    end

    personId { person.wca_id }
    personName { person.name }
    countryId { person.countryId }
    competitionId { competition.id }
    pos 1
    eventId "333oh"
    roundTypeId "f"
    formatId "a"
    value1 { best }
    value2 { average }
    value3 { average }
    value4 { average }
    value5 { average }
    best 3000
    average 5000
    regionalSingleRecord ""
    regionalAverageRecord ""
  end
end
