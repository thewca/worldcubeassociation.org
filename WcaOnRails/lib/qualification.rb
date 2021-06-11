# frozen_string_literal: true

class Qualification
  include ActiveModel::Validations

  attr_accessor :when_date, :level
  validates :when_date, presence: true
  validates :level, numericality: { only_integer: true, greater_than: 0 }

  def ==(other)
    other.class == self.class && other.to_wcif == self.to_wcif
  end

  def hash
    self.to_wcif.hash
  end

  def self.wcif_type_to_class
    @@wcif_type_to_class ||= Qualification.subclasses.map { |cls| [cls.wcif_type, cls] }.to_h
  end

  def self.load(json)
    if json.nil? || json.is_a?(self)
      json
    else
      json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
      wcif_type = json_obj['type']
      out = self.wcif_type_to_class[wcif_type].new
      out.level = json_obj['level']
      begin
        out.when_date = Date.iso8601(json_obj['whenDate'])
      rescue ArgumentError
        nil
      end
      out
    end
  end

  def self.dump(qualification)
    qualification ? JSON.dump(qualification.to_wcif) : nil
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "whenDate" => { "type" => "string" },
        "type" => { "type" => "string", "enum" => Qualification.subclasses.map(&:wcif_type) },
        "level" => { "type" => "integer" },
      },
    }
  end

  def to_wcif
    {
      "type" => self.class.wcif_type,
      "whenDate" => @when_date&.strftime("%Y-%m-%d"),
      "level" => level,
    }
  end
end

class RankingQualification < Qualification
  def self.wcif_type
    "ranking"
  end

  def to_s(event)
    I18n.t("qualification.ranking", ranking: level)
  end
end

class SingleQualification < Qualification
  def self.wcif_type
    "single"
  end

  def to_s(event)
    if event.event.timed_event?
      I18n.t("qualification.single.time", time: SolveTime.centiseconds_to_clock_format(level))
    elsif event.event.fewest_moves?
      I18n.t("qualification.single.moves", moves: level)
    elsif event.event.multiple_blindfolded?
      I18n.t("qualification.single.points", points: SolveTime.multibld_attempt_to_points(level))
    end
  end
end

class AverageQualification < Qualification
  def self.wcif_type
    "average"
  end

  def to_s(event, short: false)
    if event.event.timed_event?
      I18n.t("qualification.average.time", time: SolveTime.centiseconds_to_clock_format(level))
    elsif event.event.fewest_moves?
      I18n.t("qualification.average.moves", moves: level)
    elsif event.event.multiple_blindfolded?
      I18n.t("qualification.average.points", points: SolveTime.multibld_attempt_to_points(level))
    end
  end
end
