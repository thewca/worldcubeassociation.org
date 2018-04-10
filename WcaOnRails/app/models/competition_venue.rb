# frozen_string_literal: true

class CompetitionVenue < ApplicationRecord
  belongs_to :competition
  has_many :venue_rooms, dependent: :destroy

  accepts_nested_attributes_for :venue_rooms, allow_destroy: true

  VALID_TIMEZONES = ActiveSupport::TimeZone.all.map(&:tzinfo).map(&:name).freeze

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true
  validates_presence_of :latitude_microdegrees
  validates_presence_of :longitude_microdegrees
  validates_inclusion_of :timezone_id, in: VALID_TIMEZONES

  def load_wcif!(wcif)
    update_attributes!(CompetitionVenue.wcif_to_attributes(wcif))
    new_rooms = wcif["rooms"].map do |room_wcif|
      room = venue_rooms.find { |r| r.wcif_id == room_wcif["id"] } || venue_rooms.build
      room.load_wcif!(room_wcif)
    end
    self.venue_rooms = new_rooms
    self
  end

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "latitudeMicrodegrees" => latitude_microdegrees,
      "longitudeMicrodegrees" => longitude_microdegrees,
      "timezone" => timezone_id,
      "rooms" => venue_rooms.map(&:to_wcif),
    }
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "id" => { "type" => "integer" },
        "name" => { "type" => "string" },
        "latitudeMicrodegrees" => { "type" => "integer" },
        "longitudeMicrodegrees" => { "type" => "integer" },
        "timezone" => { "type" => "string", "enum" => VALID_TIMEZONES },
        "rooms" => { "type" => "array", "items" => VenueRoom.wcif_json_schema },
      },
      "required" => ["id", "name", "latitudeMicrodegrees", "longitudeMicrodegrees", "timezone", "rooms"],
    }
  end

  def self.wcif_to_attributes(wcif)
    {
      wcif_id: wcif["id"],
      name: wcif["name"],
      latitude_microdegrees: wcif["latitudeMicrodegrees"],
      longitude_microdegrees: wcif["longitudeMicrodegrees"],
      timezone_id: wcif["timezone"],
    }
  end
end
