# frozen_string_literal: true

FactoryBot.define do
  factory :results_submission do
    schedule_url "https://example.com/schedule"

    message "Here are the results.\nThey look good."

    results_json_str '{"results": "good"}'
  end
end
