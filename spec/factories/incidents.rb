# frozen_string_literal: true

FactoryBot.define do
  factory :incident do
    title { 'Incident title' }
    private_description { 'Some private description' }
    private_wrc_decision { 'Some private decision' }
    public_summary { 'The incident public summary' }

    transient do
      tags { ['DefaultTag'] }
      comps { [] }
    end

    incident_competitions_attributes do
      comps.map do |comp, comments|
        { competition_id: comp.id, comments: comments }
      end
    end

    trait :resolved do
      resolved_at { 1.week.ago }
    end

    trait :digest_worthy do
      digest_worthy { 1 }
    end

    trait :with_comp do
      after(:create) do |incident|
        comp = FactoryBot.create(:competition)
        incident.incident_competitions.create!(competition_id: comp.id, comments: 'some comment')
      end
    end

    factory :sent_incident do
      resolved
      digest_worthy
      digest_sent_at { 2.days.ago }
    end

    after(:create) do |incident, evaluator|
      evaluator.tags.each do |t|
        incident.incident_tags.create!(tag: t)
      end
    end
  end
end
