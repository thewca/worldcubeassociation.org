# frozen_string_literal: true

class TimeLimit
  # A note about how we handle the TimeLimit objects in the database.
  # They are serialized in the db as part of the "Round" object.
  # ActiveRecord's serialization uses a "default value" which is stored as
  # 'NULL' in the db. In order to keep the db information readable for humans,
  # we want to keep this 'NULL' value for cases where the time limit is undefined.
  # This can happens in the following cases:
  #   - Until 2013, specifying a time limit beforehand was not mandatory.
  #   Sometimes we could retrieve the information, sometimes not, therefore we
  #   use an undefined time limit when we don't have the data.
  #   - For events like 333mbf, 333mbo, and 333fm the time limit is not user
  #   defined; we can set/display it no matter what the value in the db actually
  #   is. For these events too, we want to have 'NULL' in the db.
  # This "default value" is represented - arbitrarily - by a time limit of
  # 0 seconds (see the UNDEF_TL value below).
  # When trying to serialize a time limit, ActiveRecord will compare this value
  # to the value created from TimeLimit.load(nil). If they match then 'NULL' is
  # stored, otherwise it is serialize to json according to the WCIF spec.
  # You can read more about the motivations behind this here:
  # https://github.com/thewca/worldcubeassociation.org/issues/5460
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

  UNDEF_TL = TimeLimit.new(centiseconds: 0).freeze

  # Before making changes to the 'load' and 'dump' methods below, please
  # make sure to read and understand the design comment at the beginning of
  # this file.
  def self.load(json)
    return UNDEF_TL.dup if json.nil?
    TimeLimit.new.tap do |time_limit|
      json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
      time_limit.cumulative_round_ids = json_obj['cumulativeRoundIds']
      time_limit.centiseconds = json_obj['centiseconds']
    end
  end

  def self.dump(time_limit)
    time_limit ? JSON.dump(time_limit.to_wcif) : nil
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
    return "" if round.has_undef_tl?
    time_str = SolveTime.new(round.event.id, :best, self.centiseconds).clock_format
    case self.cumulative_round_ids.length
    when 0
      if round.can_change_time_limit?
        time_str
      else
        I18n.t "time_limit.#{round.event.id}"
      end
    when 1
      I18n.t("time_limit.cumulative.one_round", time: time_str)
    else
      all_rounds = round.competition.rounds.to_h { |r| [r.wcif_id, r.name] }
      round_strs = self.cumulative_round_ids.map { |round_id| all_rounds[round_id] }
      I18n.t("time_limit.cumulative.across_rounds", time: time_str, rounds: round_strs.to_sentence)
    end
  end
end
