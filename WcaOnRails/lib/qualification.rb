# frozen_string_literal: true

class Qualification
  include ActiveModel::Validations

  attr_accessor :when_date, :level, :wcif_type, :method
  validates :when_date, presence: true
  validates :wcif_type, presence: true, inclusion: { in: ["single", "average"] }
  validates :method, presence: true, inclusion: { in: ["result", "ranking"] }
  validates :level, numericality: { only_integer: true, greater_than: 0 }

  def ==(other)
    other.class == self.class && other.to_wcif == self.to_wcif
  end

  def hash
    self.to_wcif.hash
  end

  def self.load(json)
    if json.nil? || json.is_a?(self)
      json
    else
      json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
      out = Qualification.new
      out.wcif_type = json_obj['type']
      out.method = json_obj['method']
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
        "type" => { "type" => "string", "enum" => ["single", "average"] },
        "method" => { "type" => "string", "enum" => ["result", "ranking"] },
        "level" => { "type" => "integer" },
      },
    }
  end

  def to_wcif
    {
      "type" => @wcif_type,
      "method" => @method,
      "whenDate" => @when_date&.strftime("%Y-%m-%d"),
      "level" => @level,
    }
  end

  def to_s(event)
    if self.method == "ranking"
      I18n.t("qualification." + self.wcif_type + ".ranking", ranking: level)
    elsif event.event.timed_event?
      I18n.t("qualification." + self.wcif_type + ".time", time: SolveTime.centiseconds_to_clock_format(level))
    elsif event.event.fewest_moves?
      moves = self.wcif_type == "average" ? (level.to_f / 100).round(2) : level
      I18n.t("qualification." + self.wcif_type + ".moves", moves: moves)
    elsif event.event.multiple_blindfolded?
      I18n.t("qualification." + self.wcif_type + ".points", points: SolveTime.multibld_attempt_to_points(level))
    end
  end
end
