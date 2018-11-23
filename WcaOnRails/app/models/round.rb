# frozen_string_literal: true

class Round < ApplicationRecord
  belongs_to :competition_event
  has_one :competition, through: :competition_event
  has_one :event, through: :competition_event
  belongs_to :format

  delegate :can_change_time_limit?, to: :event

  serialize :time_limit, TimeLimit
  validates_associated :time_limit

  serialize :cutoff, Cutoff
  validates_associated :cutoff

  serialize :advancement_condition, AdvancementCondition
  validates_associated :advancement_condition

  serialize :round_results, RoundResults
  validates_associated :round_results

  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

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

  def event
    Event.c_find(competition_event.event_id)
  end

  # Compute a round type id from round information
  def round_type_id
    if number == total_number_of_rounds
      cutoff ? "c" : "f"
    elsif number == 1
      cutoff ? "d" : "1"
    elsif number == 2
      cutoff ? "e" : "2"
    else
      # Combined third round/Semi Final
      cutoff ? "g" : "3"
    end
  end

  def full_format_name(with_short_names: false, with_tooltips: false)
    # 'with_tooltips' implies that short names are used for display, and long
    # names are used in the tooltip.
    cutoff_format = Format.c_find!(cutoff.number_of_attempts.to_s) if cutoff
    phase_formats = [cutoff_format, format].compact
    phase_formats.map! do |f|
      if with_tooltips
        content_tag(:span, f.short_name, data: { toggle: "tooltip" }, title: f.name)
      elsif with_short_names
        f.short_name
      else
        f.name
      end
    end
    safe_join(phase_formats, " / ")
  end

  def round_type
    RoundType.c_find(round_type_id)
  end

  def final_round?
    number == total_number_of_rounds
  end

  def name
    I18n.t("round.name", event_name: event.name, round_name: round_type.name)
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

  def self.parse_wcif_id(wcif_id)
    event_id, round_number = /^([^-]+)-r([^-]+)$/.match(wcif_id).captures
    round_number = round_number.to_i
    { event_id: event_id, round_number: round_number }
  end

  def self.wcif_to_round_attributes(wcif, round_number, total_rounds)
    {
      number: round_number,
      total_number_of_rounds: total_rounds,
      format_id: wcif["format"],
      time_limit: TimeLimit.load(wcif["timeLimit"]),
      cutoff: Cutoff.load(wcif["cutoff"]),
      advancement_condition: AdvancementCondition.load(wcif["advancementCondition"]),
      scramble_set_count: wcif["scrambleSetCount"],
      round_results: RoundResults.load(wcif["results"]),
    }
  end

  def wcif_id
    "#{event.id}-r#{self.number}"
  end

  def to_string_map
    {
      wcif_id: wcif_id,
      name: name,
      event_id: event.id,
      cumulative_round_ids: time_limit.cumulative_round_ids,
      format_name: full_format_name,
      time_limit: time_limit_to_s,
      cutoff: cutoff_to_s,
      advancement: advancement_condition_to_s,
    }
  end

  def to_wcif
    {
      "id" => wcif_id,
      "format" => self.format_id,
      "timeLimit" => event.can_change_time_limit? ? time_limit&.to_wcif : nil,
      "cutoff" => cutoff&.to_wcif,
      "advancementCondition" => advancement_condition&.to_wcif,
      "scrambleSetCount" => self.scramble_set_count,
      "results" => round_results.map(&:to_wcif),
      "extensions" => wcif_extensions.map(&:to_wcif),
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
        "results" => { "type" => "array", "items" => RoundResult.wcif_json_schema },
        "scrambleSets" => { "type" => "array" }, # TODO: expand on this
        "scrambleSetCount" => { "type" => "integer" },
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
      },
    }
  end
end
