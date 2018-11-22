# frozen_string_literal: true

# Serializes/deserializes an Array of Assignment objects.
class Assignments
  def self.load(json)
    json_array = json.is_a?(String) ? JSON.parse(json) : json
    json_array ||= []
    json_array.map(&Assignment.method(:load))
  end

  def self.dump(assignments)
    JSON.dump(assignments&.map(&:to_wcif) || [])
  end
end

class Assignment
  include ActiveModel::Validations

  attr_accessor :activity_id, :station_number, :assignment_code

  validates :activity_id, numericality: { only_integer: true }
  validates :station_number, numericality: { only_integer: true }, allow_nil: true
  validate :validate_assignment_code

  private def validate_assignment_code
    unless assignment_code.match?(/^(competitor|staff-\w+)$/)
      errors.add(:activity_code, "should be a valid assignment code")
    end
  end

  def initialize(activity_id: nil, station_number: nil, assignment_code: nil)
    self.activity_id = activity_id
    self.station_number = station_number
    self.assignment_code = assignment_code
  end

  def to_wcif
    { "activityId" => self.activity_id, "stationNumber" => self.station_number, "assignmentCode" => self.assignment_code }
  end

  def ==(other)
    other.class == self.class && other.to_wcif == self.to_wcif
  end

  def hash
    self.to_wcif.hash
  end

  def self.load(json_obj)
    self.new(activity_id: json_obj["activityId"], station_number: json_obj["stationNumber"], assignment_code: json_obj["assignmentCode"])
  end

  def self.wcif_json_schema
    {
      "type" => ["object"],
      "properties" => {
        "activityId" => { "type" => "integer" },
        "stationNumber" => { "type" => "integer" },
        "assignmentCode" => { "type" => "string" },
      },
    }
  end
end
