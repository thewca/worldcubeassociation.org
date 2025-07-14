# frozen_string_literal: true

module Types
  class CompetitionSeriesType < Types::BaseObject
    field :id, String, null: true
    field :name, String, null: true
    field :short_name, String, null: true
    field :competition_ids, [String], null: true
  end
end
