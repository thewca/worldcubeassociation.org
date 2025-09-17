# frozen_string_literal: true

module Types
  class VenueRoomType < Types::BaseObject
    field :id, Integer, null: false
    field :name, String, null: false
    field :color, String, null: false
    field :activities, [ScheduleActivityType], null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
