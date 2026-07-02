# frozen_string_literal: true

class Assignment < ApplicationRecord
  # WCIF assignment code that designates a person as a scoretaker (data entry staff).
  SCORETAKER_ASSIGNMENT_CODE = "staff-dataentry"

  belongs_to :registration, polymorphic: true
  belongs_to :schedule_activity

  scope :scoretaker, -> { where(assignment_code: SCORETAKER_ASSIGNMENT_CODE) }

  validates :station_number, numericality: { only_integer: true }, allow_nil: true
  validate :validate_assignment_code

  private def validate_assignment_code
    errors.add(:activity_code, "should be a valid assignment code") unless assignment_code.match?(/^(competitor|staff-\w+)$/)
  end

  def wcif_equal?(other_wcif)
    to_wcif.all? { |key, value| value == other_wcif[key] }
  end

  def to_wcif
    {
      "activityId" => schedule_activity.wcif_id,
      "stationNumber" => station_number,
      "assignmentCode" => assignment_code,
    }
  end

  def self.wcif_json_schema
    {
      "type" => ["object"],
      "properties" => {
        "activityId" => { "type" => "integer" },
        "stationNumber" => { "type" => %w[integer null] },
        "assignmentCode" => { "type" => "string" },
      },
    }
  end
end
