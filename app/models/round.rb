# frozen_string_literal: true

class Round < ApplicationRecord
  belongs_to :competition_event
  has_one :competition, through: :competition_event

  has_one :event, through: :competition_event
  # CompetitionEvent uses the cached value
  delegate :event, to: :competition_event

  # For the following association, we want to keep it to be able to do some joins,
  # but we definitely want to use cached values when directly using the method.
  belongs_to :format
  def format
    Format.c_find(format_id)
  end

  delegate :can_change_time_limit?, to: :event

  serialize :time_limit, coder: TimeLimit
  validates_associated :time_limit

  serialize :cutoff, coder: Cutoff
  validates_associated :cutoff

  serialize :advancement_condition, coder: AdvancementConditions::AdvancementCondition
  validates_associated :advancement_condition

  serialize :round_results, coder: RoundResults
  validates_associated :round_results

  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

  MAX_NUMBER = 4
  validates_numericality_of :number,
                            only_integer: true,
                            greater_than_or_equal_to: 1,
                            less_than_or_equal_to: MAX_NUMBER,
                            unless: :old_type

  # Qualification rounds/b-final are handled weirdly, they have round number 0
  # and do not count towards the total amount of rounds.
  OLD_TYPES=["0", "b"].freeze
  validates_inclusion_of :old_type, in: OLD_TYPES, allow_nil: true
  after_validation(if: :old_type) do
    self.number = 0
  end

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

  def initialize(attributes = nil)
    # Overrides the default constructor to setup the default time limit if not
    # set explicitly.
    # We do want to let the opportunity to the user to specify the 'undefined'
    # time limit represented as null in the db (TimeLimit::UNDEF_TL)
    attributes ||= {}
    # Note there is a subtle difference between using '||=' and 'key?'.
    # We do want to allow specifying a 'nil' value for the :time_limit attribute.
    attributes[:time_limit] = TimeLimit.new unless attributes.key?(:time_limit)
    super(attributes)
  end

  # Compute a round type id from round information
  def round_type_id
    if number == total_number_of_rounds
      cutoff ? "c" : "f"
    elsif number == 1
      cutoff ? "d" : "1"
    elsif number == 2
      cutoff ? "e" : "2"
    elsif old_type == "0"
      cutoff ? "h" : "0"
    elsif old_type == "b"
      "b"
    else
      # Cutoff third round/Semi Final
      cutoff ? "g" : "3"
    end
  end

  def formats_used
    cutoff_format = Format.c_find!(cutoff.number_of_attempts.to_s) if cutoff
    [cutoff_format, format].compact
  end

  def full_format_name(with_short_names: false, with_tooltips: false)
    # 'with_tooltips' implies that short names are used for display, and long
    # names are used in the tooltip.
    phase_formats = formats_used
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
    Round.name_from_attributes(event, round_type)
  end

  def time_limit_to_s
    time_limit.to_s(self)
  end

  def cutoff_to_s(short: false)
    cutoff ? cutoff.to_s(self, short: short) : ""
  end

  def advancement_condition_to_s(short: false)
    advancement_condition ? advancement_condition.to_s(self, short: short) : ""
  end

  def has_undef_tl?
    can_change_time_limit? && time_limit == TimeLimit::UNDEF_TL
  end

  def advancement_condition_is_valid?
    final_round? || advancement_condition
  end

  def cutoff_is_greater_than_time_limit?
    cutoff && time_limit != TimeLimit::UNDEF_TL && time_limit.cumulative_round_ids.empty? ? cutoff.attempt_result > time_limit.centiseconds : false
  end

  # cutoffs are too fast if they are less than 5 seconds
  def cutoff_is_too_fast?
    cutoff && self.event.timed_event? && cutoff.attempt_result < 500
  end

  # cutoffs are too slow if they are more than 10 minutes
  def cutoff_is_too_slow?
    cutoff && self.event.timed_event? && cutoff.attempt_result > 60_000
  end

  # time limits are too fast if they are less than 10 seconds
  def time_limit_is_too_fast?
    time_limit != TimeLimit::UNDEF_TL && time_limit.centiseconds < 1000
  end

  # time limits are too slow if they are more than 10 minutes in fast events
  def time_limit_is_too_slow?
    time_limit != TimeLimit::UNDEF_TL && time_limit.cumulative_round_ids.empty? && self.event.fast_event? && time_limit.centiseconds > 60_000
  end

  def self.parse_wcif_id(wcif_id)
    event_id, round_number = /^([^-]+)-r([^-]+)$/.match(wcif_id).captures
    round_number = round_number.to_i
    { event_id: event_id, round_number: round_number }
  end

  def self.wcif_to_round_attributes(event, wcif, round_number, total_rounds)
    {
      number: round_number,
      total_number_of_rounds: total_rounds,
      format_id: wcif["format"],
      time_limit: event.can_change_time_limit? ? TimeLimit.load(wcif["timeLimit"]) : nil,
      cutoff: Cutoff.load(wcif["cutoff"]),
      advancement_condition: AdvancementConditions::AdvancementCondition.load(wcif["advancementCondition"]),
      scramble_set_count: wcif["scrambleSetCount"],
      round_results: RoundResults.load(wcif["results"]),
    }
  end

  def wcif_id
    "#{event.id}-r#{self.number}"
  end

  def to_string_map(short: false)
    {
      wcif_id: wcif_id,
      name: name,
      event_id: event.id,
      cumulative_round_ids: time_limit.cumulative_round_ids,
      format_name: full_format_name(with_short_names: true),
      time_limit: time_limit_to_s,
      cutoff: cutoff_to_s(short: short),
      advancement: advancement_condition_to_s(short: short),
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
        "advancementCondition" => AdvancementConditions::AdvancementCondition.wcif_json_schema,
        "results" => { "type" => "array", "items" => RoundResult.wcif_json_schema },
        "scrambleSets" => { "type" => "array" }, # TODO: expand on this
        "scrambleSetCount" => { "type" => "integer" },
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
      },
    }
  end

  def self.name_from_attributes_id(event_id, round_type_id)
    name_from_attributes(Event.c_find(event_id), RoundType.c_find(round_type_id))
  end

  def self.name_from_attributes(event, round_type)
    I18n.t("round.name", event_name: event.name, round_name: round_type.name)
  end
end
