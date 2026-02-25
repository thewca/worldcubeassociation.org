# frozen_string_literal: true

FactoryBot.define do
  resultable_instance_members = lambda { |*_args|
    transient do
      competition { FactoryBot.create(:competition, event_ids: ["333oh"]) }
    end

    trait :skip_validation do
      to_create { |res| res.save(validate: false) }
    end

    competition_id { competition.id }
    pos { 1 }
    event_id { "333oh" }
    round_type_id { "f" }
    format_id { "a" }

    best { 3000 }
    average { 5000 }
    round { association(:round, competition: competition, event_id: event_id, format_id: format_id) }

    trait :mbf do
      event_id { "333mbf" }
      format_id { "3" }
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
      event_id { "333fm" }
      format_id { "m" }
      average { 3500 }
      best { 35 }
      value1 { best }
      value2 { best }
      value3 { best }
      value4 { 0 }
      value5 { 0 }
    end

    trait :mo3 do
      format_id { "m" }
      average { best }
      value1 { best }
      value2 { best }
      value3 { best }
      value4 { 0 }
      value5 { 0 }
    end

    trait :blind_mo3 do
      mo3
      event_id { "333bf" }
      format_id { "3" }
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
      round_type_id { "c" }
    end
  }

  factory :inbox_result do
    instance_eval(&resultable_instance_members)

    value1 { best }
    value2 { average }
    value3 { average }
    value4 { average }
    value5 { average }

    transient do
      person { FactoryBot.create(:inbox_person, competition_id: competition.id) }
    end

    trait :for_existing_person do
      transient do
        real_person { FactoryBot.create(:person) }
      end

      person do
        FactoryBot.create(:inbox_person,
                          competition_id: competition.id,
                          **real_person.slice(:name, :wca_id, :gender, :dob, :country_iso2))
      end
    end

    person_id { person.ref_id }
  end

  factory :result do
    instance_eval(&resultable_instance_members)

    transient do
      value1 { best }
      value2 { average }
      value3 { average }
      value4 { average }
      value5 { average }
    end

    transient do
      person { FactoryBot.create(:person) }
    end

    person_id { person.wca_id }
    person_name { person.name }
    country_id { person.country_id }
    regional_single_record { nil }
    regional_average_record { nil }

    after(:build) do |result, builder|
      legacy_attempts = (1..5).map { builder.public_send(:"value#{it}") }

      Result.unpack_attempt_attributes(legacy_attempts).each do |at|
        result.result_attempts.build(**at)
      end
    end
  end
end
