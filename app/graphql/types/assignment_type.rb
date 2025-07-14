# frozen_string_literal: true

module Types
  class AssignmentType < Types::BaseObject
    field :activity_id, Integer, null: false
    field :station_number, Integer, null: true
    field :assignment_code, String, null: false
  end
end
