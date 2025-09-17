# frozen_string_literal: true

module Types
  class ScheduleActivityType < Types::BaseObject
    field :id, Integer, null: false
    field :name, String, null: false
    field :activityCode, String, null: false
    field :startTime, String, null: false
    field :endTime, String, null: false
    field :childActivities, [ScheduleActivityType], null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
