# frozen_string_literal: true

module Types
  class CompetitionSeriesType < Types::BaseObject
    field :id, String, null: true
    field :name, String, null: true
    field :shortName, String, null: true
    field :competitionIds, [String], null: true
  end
end
