# frozen_string_literal: true

# Create a bunch of people with WCA IDs so we can seed large competitions.
100.times do
  FactoryBot.create :user, :wca_id
end
