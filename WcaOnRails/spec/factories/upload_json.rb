# frozen_string_literal: true

FactoryBot.define do
  factory :upload_json do
    competition_id { FactoryBot.create(:competition, id: "TestComp2018").id }
    results_json_str { '{"formatVersion": "1.0", "competitionId":"TestComp2018", "persons": [], "events": []}' }
  end
end
