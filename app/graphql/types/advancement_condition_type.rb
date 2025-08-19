# frozen_string_literal: true

module Types
  class AdvancementConditionType < Types::BaseObject
    field :type, String, null: false
    field :level, Integer, null: false
  end
end
