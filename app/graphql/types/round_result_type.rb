# frozen_string_literal: true

module Types
  class RoundResultType < Types::BaseObject
    field :personId, Integer, null: false
    field :ranking, Integer, null: true
    field :attempts, [RoundResultAttemptType], null: false
    field :best, Integer, null: false
    field :average, Integer, null: false
  end
end
