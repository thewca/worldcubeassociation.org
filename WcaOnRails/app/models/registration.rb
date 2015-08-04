class Registration < ActiveRecord::Base
  self.table_name = "Preregs"

  validates :status, inclusion: { in: ["p", "a"] }
  validate :events_must_be_valid

  belongs_to :competition, foreign_key: "competitionId"

  def events
    (eventIds || "").split.map { |e| Event.find_by_id(e) }.sort_by &:rank
  end

  def accepted?
    status == "a"
  end

  def pending?
    status == "p"
  end

  def birthday
    "%04i-%02i-%02i" % [ birthYear, birthMonth, birthDay ]
  end

  private def events_must_be_valid
    invalid_events = events - Event.all_official - Event.all_deprecated
    unless invalid_events.empty?
      errors.add(:eventSpecs, "invalid event ids: #{invalid_events.map(&:id).join(',')}")
    end
  end
end
