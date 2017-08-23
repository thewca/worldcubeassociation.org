# frozen_string_literal: true

class TimeLimit
  include ActiveModel::Validations

  attr_accessor :centiseconds
  attr_reader :cumulative_round_ids
  validates :centiseconds, numericality: { only_integer: true }
  validate do
    unless self.cumulative_round_ids.is_a?(Array) && self.cumulative_round_ids.all? { |id| id.is_a?(String) }
      errors.add(:cumulative_round_ids, "must be an Array of Strings")
    end
  end

  def initialize(centiseconds: 10.minutes.in_centiseconds, cumulative_round_ids: [].freeze)
    self.centiseconds = centiseconds
    self.cumulative_round_ids = cumulative_round_ids
  end

  def cumulative_round_ids=(cumulative_round_ids)
    @cumulative_round_ids = cumulative_round_ids || []
  end

  def to_wcif
    { "centiseconds" => self.centiseconds, "cumulativeRoundIds" => self.cumulative_round_ids }
  end

  def ==(other)
    other.class == self.class && other.to_wcif == self.to_wcif
  end

  def hash
    self.to_wcif.hash
  end

  def self.load(json)
    TimeLimit.new.tap do |time_limit|
      unless json.nil?
        json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
        time_limit.cumulative_round_ids = json_obj['cumulativeRoundIds']
        time_limit.centiseconds = json_obj['centiseconds']
      end
    end
  end

  def self.dump(time_limit)
    time_limit ? JSON.dump(time_limit.to_wcif) : nil
  end

  private def wcif_round_id_to_round(competition, wcif_round_id)
    event_id, round_number = wcif_round_id.split("-")
    competition_event = competition.competition_events.find_by_event_id!(event_id)
    competition_event.rounds.find_by_number!(round_number)
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "centiseconds" => { "type" => "integer" },
        "cumulativeRoundIds" => { "type" => "array", "items" => { "type" => "string" } },
      },
    }
  end

  def to_s(round)
    time_str = SolveTime.new(round.competition_event.event_id, :best, self.centiseconds).clock_format
    case self.cumulative_round_ids.length
    when 0
      time_str
    when 1
      I18n.t("time_limit.cumulative.one_round", time: time_str)
    else
      rounds = self.cumulative_round_ids.map { |round_id| wcif_round_id_to_round(round.competition, round_id) }
      rounds_str = rounds.map(&:name).to_sentence
      I18n.t("time_limit.cumulative.across_rounds", time: time_str, rounds: rounds_str)
    end
  end
end
