# frozen_string_literal: true

module Types
  class CutoffType < Types::BaseObject
    field :number_of_attempts, Integer, null: false
    field :attempt_result, Integer, null: false
  end
end
