# frozen_string_literal: true

module Types
  class RoundResultAttemptType < Types::BaseObject
    field :result, Integer, null: false
    field :reconstruction, String, null: true
  end
end
