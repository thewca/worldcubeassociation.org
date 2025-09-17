# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :competition, Types::CompetitionType, null: false do
      argument :id, ID, required: true
    end

    def competition(id:)
      Competition.find(id)
    end
  end
end
