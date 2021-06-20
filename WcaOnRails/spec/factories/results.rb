# frozen_string_literal: true

FactoryBot.define do
  resultable_instance_members = ->(*args) {
    transient do
      competition { FactoryBot.create(:competition, event_ids: ["333oh"]) }
      skip_round_creation { false }
    end

    trait :skip_validation do
      to_create { |res| res.save(validate: false) }
    end

    after(:build) do |result, options|
      # In order to be valid, a result must have a round.
      # Make sure it exists before going through validations.
      if !result.round && !options.skip_round_creation
        FactoryBot.create(:round, competition: result.competition, event_id: result.eventId, format_id: result.formatId)
      end
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

    trait :mbf do
      eventId { "333mbf" }
      formatId { "3" }
      average { 0 }
      # 9 points in 4 minutes
      best { 900_024_000 }
      value1 { best }
      # 4 points in 2 minutes
      value2 { 950_012_000 }
      value3 { -1 }
      value4 { 0 }
      value5 { 0 }
    end

    trait :fm do
      eventId { "333fm" }
      formatId { "m" }
      average { 3500 }
      best { 35 }
      value1 { best }
      value2 { best }
      value3 { best }
      value4 { 0 }
      value5 { 0 }
    end

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

    trait :over_cutoff do
      transient do
        cutoff { nil }
      end
      value1 { cutoff.attempt_result + 100 }
      value2 { cutoff.attempt_result + 200 }
      value3 { 0 }
      value4 { 0 }
      value5 { 0 }
      best { cutoff.attempt_result + 100 }
      average { 0 }
      roundTypeId { "c" }
    end
  }

  factory :inbox_result do
    instance_eval(&resultable_instance_members)
    transient do
      person { FactoryBot.create(:inbox_person, competitionId: competition.id) }
    end

    trait :for_existing_person do
      transient do
        real_person { FactoryBot.create(:person) }
      end
      person {
        FactoryBot.create(:inbox_person,
                          competitionId: competition.id,
                          name: real_person.name, wcaId: real_person.wca_id,
                          gender: real_person.gender, dob: real_person.dob,
                          countryId: real_person.country.iso2)
      }
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
