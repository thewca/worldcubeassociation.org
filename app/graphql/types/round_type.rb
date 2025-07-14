# frozen_string_literal: true

module Types
  class RoundType < Types::BaseObject
    field :id, String, null: false
    field :format, String, null: false
    field :time_limit, Types::TimeLimitType, null: true
    field :cutoff, Types::CutoffType, null: true
    field :advancement_condition, Types::AdvancementConditionType, null: true
    field :results, [Types::RoundResultType], null: false
    field :scramble_sets, [GraphQL::Types::JSON], null: false
    field :scramble_set_count, Integer, null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
