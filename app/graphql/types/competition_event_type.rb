# frozen_string_literal: true

module Types
  class CompetitionEventType < Types::BaseObject
    field :id, String, null: false
    field :rounds, [Types::RoundType], null: true
    field :competitor_limit, Integer, null: true
    field :qualification, Types::QualificationType, null: true
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
