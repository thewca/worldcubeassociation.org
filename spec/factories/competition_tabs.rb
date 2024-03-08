# frozen_string_literal: true

FactoryBot.define do
  factory :competition_tab do
    competition
    sequence(:name) { |n| "Info tab #{n}" }
    content { 'Some additional informations.' }
  end
end
