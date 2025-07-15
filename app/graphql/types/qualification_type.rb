# frozen_string_literal: true

module Types
  class QualificationType < Types::BaseObject
    field :whenDate, String, null: false
    field :resultType, String, null: false
    field :type, String, null: false
    field :level, Integer, null: true
  end
end
