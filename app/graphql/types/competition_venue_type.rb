# frozen_string_literal: true

module Types
  class CompetitionVenueType < Types::BaseObject
    field :id, Integer, null: false
    field :name, String, null: false
    field :latitude_microdegrees, Integer, null: false
    field :longitude_microdegrees, Integer, null: false
    field :country_iso2, String, null: false
    field :timezone, String, null: false
    field :rooms, [Types::VenueRoomType], null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
