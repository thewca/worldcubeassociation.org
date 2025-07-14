# frozen_string_literal: true

module Types
  class ScheduleActivityType < Types::BaseObject
    field :id, Integer, null: false
    field :name, String, null: false
    field :activity_code, String, null: false
    field :start_time, String, null: false
    field :end_time, String, null: false
    field :child_activities, [ScheduleActivityType], null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
