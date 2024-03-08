# frozen_string_literal: true

FactoryBot.define do
  factory :results_submission do
    competition_id { FactoryBot.create(:competition, :with_valid_submitted_results).id }

    schedule_url { 'https://example.com/schedule' }

    message { "Here are the results.\nThey look good." }

    confirm_information { true }
  end
end
