# frozen_string_literal: true

FactoryBot.define do
  factory :team_member do
    team_id { 1 }
    user_id { 1 }
    start_date { '2016-02-18' }
    end_date { nil }
  end
end
