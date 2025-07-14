# frozen_string_literal: true

module Types
  class CompetitionType < Types::BaseObject
    field :format_version, String, null: false
    field :id, String, null: false
    field :name, String, null: false
    field :short_name, String, null: false
    field :series, Types::CompetitionSeriesType, null: true
    field :persons, [Types::UserType], null: false
    field :events, [Types::CompetitionEventType], null: false
    field :schedule, Types::CompetitionScheduleType, null: true
    field :competitor_limit, Integer, null: true
    field :extensions, [Types::WcifExtensionType], null: false
    field :registration_info, Types::RegistrationInfoType, null: true
  end
end
