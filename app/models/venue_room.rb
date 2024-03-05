# frozen_string_literal: true

class VenueRoom < ApplicationRecord
  # WCA's blue
  DEFAULT_ROOM_COLOR = "#304a96"
  belongs_to :competition_venue
  has_one :competition, through: :competition_venue
  delegate :start_time, to: :competition
  delegate :end_time, to: :competition
  has_many :schedule_activities, as: :holder, dependent: :destroy
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

  validates :color, format: { with: /\A#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\z/, message: "Please input a valid hexadecimal color code" }

  before_validation do
    self.color ||= DEFAULT_ROOM_COLOR
  end

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true

  def all_activities
    schedule_activities.flat_map(&:all_activities)
  end

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "color" => color,
      "activities" => schedule_activities.map(&:to_wcif),
      "extensions" => wcif_extensions.map(&:to_wcif),
    }
  end

  def activities_for_date(date)
    schedule_activities.select do |a|
      a.start_time.to_date == date
    end
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "id" => { "type" => "integer" },
        "name" => { "type" => "string" },
        "color" => { "type" => "string" },
        "activities" => { "type" => "array", "items" => ScheduleActivity.wcif_json_schema },
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
      },
      "required" => ["id", "name", "activities"],
    }
  end

  def load_wcif!(wcif)
    update!(VenueRoom.wcif_to_attributes(wcif))
    new_activities = wcif["activities"].map do |activity_wcif|
      activity = schedule_activities.find { |a| a.wcif_id == activity_wcif["id"] } || schedule_activities.build
      activity.load_wcif!(activity_wcif)
    end
    self.schedule_activities = new_activities
    WcifExtension.update_wcif_extensions!(self, wcif["extensions"]) if wcif["extensions"]
    self
  end

  def self.wcif_to_attributes(wcif)
    {
      wcif_id: wcif["id"],
      name: wcif["name"],
      color: wcif["color"],
    }
  end
end
