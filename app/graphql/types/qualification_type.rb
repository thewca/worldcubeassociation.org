# frozen_string_literal: true

module Types
  class QualificationType < Types::BaseObject
    field :when_date, String, null: false
    field :result_type, String, null: false
    field :type, String, null: false
    field :level, Integer, null: true
  end
end
