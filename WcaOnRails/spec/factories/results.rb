# frozen_string_literal: true

FactoryBot.define do
  resultable_instance_members = ->(*args) {
    transient do
      competition { FactoryBot.create(:competition, event_ids: ["333oh"]) }
    end

    competitionId { competition.id }
    pos { 1 }
    eventId { "333oh" }
    roundTypeId { "f" }
    formatId { "a" }
    value1 { best }
    value2 { average }
    value3 { average }
    value4 { average }
    value5 { average }
    best { 3000 }
    average { 5000 }

    trait :mo3 do
      formatId { "m" }
      average { best }
      value1 { best }
      value2 { best }
      value3 { best }
      value4 { 0 }
      value5 { 0 }
    end

    trait :blind_mo3 do
      mo3
      eventId { "333bf" }
      formatId { "3" }
    end

    trait :blind_dnf_mo3 do
      blind_mo3
      average { -1 }
      value3 { -1 }
    end
  }

  factory :inbox_result do
    instance_eval(&resultable_instance_members)
    transient do
      person { FactoryBot.create(:inbox_person, competitionId: competition.id) }
    end

    personId { person.id }
  end

  factory :result do
    instance_eval(&resultable_instance_members)
    transient do
      person { FactoryBot.create(:person) }
    end

    personId { person.wca_id }
    personName { person.name }
    countryId { person.countryId }
    regionalSingleRecord { "" }
    regionalAverageRecord { "" }
  end
end
