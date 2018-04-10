# frozen_string_literal: true

class VenueRoom < ApplicationRecord
  belongs_to :competition_venue
  has_one :competition, through: :competition_venue
  delegate :start_time, to: :competition
  delegate :end_time, to: :competition
  has_many :schedule_activities, as: :holder, dependent: :destroy

  accepts_nested_attributes_for :schedule_activities, allow_destroy: true

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "activities" => schedule_activities.map(&:to_wcif),
    }
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "id" => { "type" => "integer" },
        "name" => { "type" => "string" },
        "activities" => { "type" => "array", "items" => ScheduleActivity.wcif_json_schema },
      },
      "required" => ["id", "name", "activities"],
    }
  end

  def load_wcif!(wcif)
    update_attributes!(VenueRoom.wcif_to_attributes(wcif))
    new_activities = wcif["activities"].map do |activity_wcif|
      activity = schedule_activities.find { |a| a.wcif_id == activity_wcif["id"] } || schedule_activities.build
      activity.load_wcif!(activity_wcif)
    end
    self.schedule_activities = new_activities
    self
  end

  def self.wcif_to_attributes(wcif)
    {
      wcif_id: wcif["id"],
      name: wcif["name"],
    }
  end
end
