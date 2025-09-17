# frozen_string_literal: true

module Types
  class AssignmentType < Types::BaseObject
    field :activityId, Integer, null: false
    field :stationNumber, Integer, null: true
    field :assignmentCode, String, null: false
  end
end
