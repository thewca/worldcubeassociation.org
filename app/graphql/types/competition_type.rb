# frozen_string_literal: true

module Types
  class CompetitionType < Types::BaseObject
    field :format_version, String, null: false
    field :id, String, null: false
    field :name, String, null: false
    field :short_name, String, null: false
    field :series, Types::CompetitionSeriesType, null: true
    field :persons, [Types::UserType], null: false, method: :persons_wcif
    field :events, [Types::CompetitionEventType], null: false, method: :events_wcif
    field :schedule, Types::CompetitionScheduleType, null: true, method: :schedule_wcif
    field :competitor_limit, Integer, null: true
    field :extensions, [Types::WcifExtensionType], null: false
    field :registration_info, Types::RegistrationInfoType, null: true, method: :itself

    def format_version
      "1.0"
    end

    def series
      object.part_of_competition_series? ? object.competition_series_wcif : nil
    end

    def extensions
      object.wcif_extensions.map(&:to_wcif)
    end
  end
end
