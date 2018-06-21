# frozen_string_literal: true

FactoryBot.define do
  factory :results_submission do
    message "Here are the results.\nThey look good."

    results_json_str '{"results": "good"}'
  end
end
