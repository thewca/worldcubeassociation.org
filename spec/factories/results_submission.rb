# frozen_string_literal: true

FactoryBot.define do
  factory :results_submission do
    competition_id { FactoryBot.create(:competition, :with_valid_submitted_results).id }

    message { "Here are the results.\nThey look good." }
  end
end
