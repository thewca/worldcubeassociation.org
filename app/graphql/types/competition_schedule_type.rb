# frozen_string_literal: true

module Types
  class CompetitionScheduleType < Types::BaseObject
    field :venues, [Types::CompetitionVenueType], null: false
    field :startDate, String, null: false
    field :numberOfDays, Integer, null: false
  end
end
