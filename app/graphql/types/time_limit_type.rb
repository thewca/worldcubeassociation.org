# frozen_string_literal: true

module Types
  class TimeLimitType < Types::BaseObject
    field :centiseconds, Integer, null: false
    field :cumulative_round_ids, [String], null: false
  end
end
