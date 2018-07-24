# frozen_string_literal: true

FactoryBot.define do
  factory :results_submission do
    competition_id { FactoryBot.create(:competition).id }

    schedule_url { "https://example.com/schedule" }

    message { "Here are the results.\nThey look good." }
  end
end
