# frozen_string_literal: true

class Round < ApplicationRecord
  belongs_to :competition_event
  has_one :competition, through: :competition_event
  has_one :event, through: :competition_event
  belongs_to :format

  serialize :time_limit, TimeLimit
  validates_associated :time_limit

  serialize :cutoff, Cutoff
  validates_associated :cutoff

  serialize :advancement_condition, AdvancementCondition
  validates_associated :advancement_condition

  MAX_NUMBER = 4
  validates_numericality_of :number,
                            only_integer: true,
                            greater_than_or_equal_to: 1,
                            less_than_or_equal_to: MAX_NUMBER

  validate do
    unless event.preferred_formats.find_by_format_id(format_id)
      errors.add(:format, "'#{format_id}' is not allowed for '#{event.id}'")
    end
  end

  validate do
    if final_round? && advancement_condition
      errors.add(:advancement_condition, "cannot be set on a final round")
    end
  end

  def final_round?
    competition_event.rounds.last == self
  end

  def name
    I18n.t("round.name", event: event.name, number: self.number)
  end

  def time_limit_to_s
    time_limit.to_s(self)
  end

  def cutoff_to_s
    cutoff ? cutoff.to_s(self) : ""
  end

  def advancement_condition_to_s
    advancement_condition ? advancement_condition.to_s(self) : ""
  end

  def self.wcif_to_round_attributes(wcif, round_number)
    {
      number: round_number,
      format_id: wcif["format"],
      time_limit: TimeLimit.load(wcif["timeLimit"]),
      cutoff: Cutoff.load(wcif["cutoff"]),
      advancement_condition: AdvancementCondition.load(wcif["advancementCondition"]),
    }
  end

  def to_wcif
    {
      "id" => "#{event.id}-#{self.number}",
      "format" => self.format_id,
      "timeLimit" => time_limit&.to_wcif,
      "cutoff" => cutoff&.to_wcif,
      "advancementCondition" => advancement_condition&.to_wcif,
    }
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "id" => { "type" => "string" },
        "format" => { "type" => "string", "enum" => Format.pluck(:id) },
        "timeLimit" => TimeLimit.wcif_json_schema,
        "cutoff" => Cutoff.wcif_json_schema,
        "advancementCondition" => AdvancementCondition.wcif_json_schema,
        "roundResults" => { "type" => "array" }, # TODO: expand on this
        "groups" => { "type" => "array" }, # TODO: expand on this
      },
    }
  end
end
