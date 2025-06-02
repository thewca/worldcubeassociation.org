# frozen_string_literal: true

FactoryBot.define do
  factory :competition_event do
    # We have to pass an empty array here because otherwise,
    #   the `competition` factory recursively creates another competition_event
    #   via the `has_many :events, through: :competition_events` association.
    # Need to improve this by using a proper `association` factory in the future.
    competition { association :competition, event_ids: [] }
    event_id { "333" }
    fee_lowest_denomination { 0 }
  end
end
