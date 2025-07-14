# frozen_string_literal: true

module Types
  class CompetitionScheduleType < Types::BaseObject
    field :venues, [Types::CompetitionVenueType], null: false
    field :start_date, String, null: false
    field :number_of_days, Integer, null: false
  end
end
