# frozen_string_literal: true

class CompetitionVenue < ApplicationRecord
  belongs_to :competition
  has_many :venue_rooms, dependent: :destroy
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

  belongs_to :country, foreign_key: :country_iso2, primary_key: :iso2
  has_one :continent, foreign_key: :continentId, through: :country

  delegate :continent, to: :country, allow_nil: true

  VALID_TIMEZONES = TZInfo::Timezone.all_identifiers.freeze

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true
  validates_presence_of :latitude_microdegrees
  validates_presence_of :longitude_microdegrees
  validates_inclusion_of :timezone_id, in: VALID_TIMEZONES

  def country
    Country.find_by_iso2(self.country_iso2)
  end

  def load_wcif!(wcif)
    update!(CompetitionVenue.wcif_to_attributes(wcif))
    new_rooms = wcif["rooms"].map do |room_wcif|
      room = venue_rooms.find { |r| r.wcif_id == room_wcif["id"] } || venue_rooms.build
      room.load_wcif!(room_wcif)
    end
    self.venue_rooms = new_rooms
    WcifExtension.update_wcif_extensions!(self, wcif["extensions"]) if wcif["extensions"]
    self
  end

  def latitude_degrees
    latitude_microdegrees / 1e6
  end

  def longitude_degrees
    longitude_microdegrees / 1e6
  end

  def all_activities
    venue_rooms.flat_map(&:all_activities).sort_by(&:start_time)
  end

  def top_level_activities
    venue_rooms.flat_map(&:schedule_activities)
  end

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "latitudeMicrodegrees" => latitude_microdegrees,
      "longitudeMicrodegrees" => longitude_microdegrees,
      "countryIso2" => country_iso2,
      "timezone" => timezone_id,
      "rooms" => venue_rooms.map(&:to_wcif),
      "extensions" => wcif_extensions.map(&:to_wcif),
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
        "countryIso2" => { "type" => "string" },
        "timezone" => { "type" => "string", "enum" => VALID_TIMEZONES },
        "rooms" => { "type" => "array", "items" => VenueRoom.wcif_json_schema },
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
      },
      "required" => ["id", "name", "latitudeMicrodegrees", "countryIso2", "longitudeMicrodegrees", "timezone", "rooms"],
    }
  end

  def self.wcif_to_attributes(wcif)
    {
      wcif_id: wcif["id"],
      name: wcif["name"],
      country_iso2: wcif["countryIso2"],
      latitude_microdegrees: wcif["latitudeMicrodegrees"],
      longitude_microdegrees: wcif["longitudeMicrodegrees"],
      timezone_id: wcif["timezone"],
    }
  end
end
