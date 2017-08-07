# frozen_string_literal: true

class AdvancementCondition
  include ActiveModel::Validations

  attr_accessor :level
  validates :level, numericality: { only_integer: true }

  def initialize(level)
    self.level = level
  end

  def to_wcif
    { "type" => self.class.wcif_type, "level" => self.level }
  end

  def ==(other)
    other.class == self.class && other.to_wcif == self.to_wcif
  end

  def hash
    self.to_wcif.hash
  end

  def self.wcif_type_to_class
    @@wcif_type_to_class ||= AdvancementCondition.subclasses.map { |cls| [cls.wcif_type, cls] }.to_h
  end

  def self.load(json)
    if json.nil? || json.is_a?(self)
      json
    else
      json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
      wcif_type = json_obj['type']
      self.wcif_type_to_class[wcif_type].new(json_obj['level'])
    end
  end

  def self.dump(cutoff)
    cutoff ? JSON.dump(cutoff.to_wcif) : nil
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "type" => { "type" => "string", "enum" => AdvancementCondition.subclasses.map(&:wcif_type) },
        "level" => { "type" => "integer" },
      },
    }
  end
end

class RankingCondition < AdvancementCondition
  alias_method :ranking, :level

  def self.wcif_type
    "ranking"
  end

  def to_s(round)
    I18n.t("advancement_condition.ranking", ranking: ranking, next_round_number: round.number + 1)
  end
end

class PercentCondition < AdvancementCondition
  alias_method :percent, :level

  def self.wcif_type
    "percent"
  end

  def to_s(round)
    I18n.t("advancement_condition.percent", percent: percent, next_round_number: round.number + 1)
  end
end

class AttemptResultCondition < AdvancementCondition
  alias_method :attempt_result, :level

  def self.wcif_type
    "attemptResult"
  end

  def to_s(round)
    if round.event.timed_event?
      I18n.t("advancement_condition.attempt_result.time", time: SolveTime.centiseconds_to_clock_format(attempt_result), next_round_number: round.number + 1)
    elsif round.event.fewest_moves?
      I18n.t("advancement_condition.attempt_result.moves", moves: attempt_result, next_round_number: round.number + 1)
    elsif round.event.multiple_blindfolded?
      I18n.t("advancement_condition.attempt_result.points", points: SolveTime.multibld_attempt_to_points(attempt_result), next_round_number: round.number + 1)
    end
  end
end
