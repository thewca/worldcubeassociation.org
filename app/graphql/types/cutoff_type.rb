# frozen_string_literal: true

module Types
  class CutoffType < Types::BaseObject
    field :numberOfAttempts, Integer, null: false
    field :attemptResult, Integer, null: false
  end
end
