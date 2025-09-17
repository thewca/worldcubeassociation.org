# frozen_string_literal: true

module Types
  class CompetitionVenueType < Types::BaseObject
    field :id, Integer, null: false
    field :name, String, null: false
    field :latitudeMicrodegrees, Integer, null: false
    field :longitudeMicrodegrees, Integer, null: false
    field :countryIso2, String, null: false
    field :timezone, String, null: false
    field :rooms, [Types::VenueRoomType], null: false
    field :extensions, [Types::WcifExtensionType], null: false
  end
end
