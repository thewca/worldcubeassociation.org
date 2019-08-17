# frozen_string_literal: true

# Serializes/deserializes an Array of RoundResult objects.
class RoundResults
  def self.load(json)
    json_array = json.is_a?(String) ? JSON.parse(json) : json
    json_array ||= []
    json_array.map(&RoundResult.method(:load))
  end

  def self.dump(round_results)
    JSON.dump(round_results&.map(&:to_wcif) || [])
  end
end

class RoundResult
  include ActiveModel::Validations

  attr_accessor :person_id, :ranking, :attempts, :best, :average
  validates :person_id, numericality: { only_integer: true }
  validates :ranking, numericality: { only_integer: true }, allow_nil: true
  validates :attempts, length: { maximum: 5, message: "must have at most 5 attempts" }
  validates :best, numericality: { only_integer: true }
  validates :average, numericality: { only_integer: true }

  def initialize(person_id: nil, ranking: nil, attempts: nil, best: nil, average: nil)
    self.person_id = person_id
    self.ranking = ranking
    self.attempts = attempts
    self.best = best
    self.average = average
  end

  def to_wcif
    {
      "personId" => self.person_id,
      "ranking" => self.ranking,
      "attempts" => self.attempts.map(&:to_wcif),
      "best" => self.best,
      "average" => self.average,
    }
  end

  def ==(other)
    other.class == self.class && other.to_wcif == self.to_wcif
  end

  def hash
    self.to_wcif.hash
  end

  def self.load(json_obj)
    self.new(
      person_id: json_obj['personId'],
      ranking: json_obj['ranking'],
      attempts: json_obj['attempts'].map(&Attempt.method(:load)),
      best: json_obj['best'],
      average: json_obj['average'],
    )
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "personId" => { "type" => "integer" },
        "ranking" => { "type" => ["integer", "null"] },
        "attempts" => { "type" => "array", "items" => Attempt.wcif_json_schema },
        "best" => { "type" => "integer" },
        "average" => { "type" => "integer" },
      },
    }
  end
end

class Attempt
  include ActiveModel::Validations

  attr_accessor :result, :reconstruction
  validates :result, numericality: { only_integer: true }

  def initialize(result: nil, reconstruction: nil)
    self.result = result
    self.reconstruction = reconstruction
  end

  def to_wcif
    { "result" => self.result, "reconstruction" => self.reconstruction }
  end

  def self.load(json_obj)
    self.new(result: json_obj['result'], reconstruction: json_obj['reconstruction'])
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "result" => { "type" => "integer" },
        "reconstruction" => { "type" => ["string", "null"] },
      },
    }
  end
end
