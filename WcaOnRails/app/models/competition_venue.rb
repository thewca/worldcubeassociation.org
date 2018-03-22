class CompetitionVenue < ApplicationRecord
  belongs_to :competition
  has_many :venue_rooms, dependent: :destroy

  VALID_TIMEZONES = ActiveSupport::TimeZone.all.map(&:tzinfo).map(&:name).freeze

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true
  validates_presence_of :latitude_microdegrees
  validates_presence_of :longitude_microdegrees
  validates_inclusion_of :timezone_id, in: VALID_TIMEZONES

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
end
