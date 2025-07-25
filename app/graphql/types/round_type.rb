# frozen_string_literal: true

module Types
  class RoundType < Types::BaseObject
    field :id, String, null: false
    field :format, String, null: false
    field :timeLimit, Types::TimeLimitType, null: true
    field :cutoff, Types::CutoffType, null: true
    field :advancementCondition, Types::AdvancementConditionType, null: true
    field :results, [Types::RoundResultType], null: false
    field :scrambleSets, [GraphQL::Types::JSON], null: false
    field :scrambleSetCount, Integer, null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
