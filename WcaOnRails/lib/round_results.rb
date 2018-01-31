# frozen_string_literal: true

# Serializes/deserializes an Array of RoundResult objects.
class RoundResults
  def self.load(json)
    if json.nil?
      []
    elsif json.is_a?(Array) && json.all? { |item| item.is_a?(RoundResult) }
      json
    else
      json_array = json.is_a?(Array) ? json : JSON.parse(json)
      json_array.map(&RoundResult.method(:load))
    end
  end

  def self.dump(round_results)
    JSON.dump(round_results&.map(&:to_wcif) || [])
  end
end

class RoundResult
  include ActiveModel::Validations

  attr_accessor :person_id, :ranking, :attempts
  validates :person_id, numericality: { only_integer: true }
  validates :ranking, numericality: { only_integer: true }
  validates :attempts, length: { is: 5, message: "must have 5 attempts" }

  def initialize(person_id: nil, ranking: nil, attempts: nil)
    self.person_id = person_id
    self.ranking = ranking
    self.attempts = attempts
  end

  def to_wcif
    { "personId" => self.person_id, "ranking" => self.ranking, "attempts" => self.attempts.map(&:to_wcif) }
  end

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
      self.new.tap do |round_result|
        json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
        round_result.person_id = json_obj['personId']
        round_result.ranking = json_obj['ranking']
        round_result.attempts = json_obj['attempts'].map(&Attempt.method(:load))
      end
    end
  end

  def self.dump(round_result)
    round_result ? JSON.dump(round_result.to_wcif) : nil
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "personId" => { "type" => "integer" },
        "ranking" => { "type" => "integer" },
        "attempts" => { "type" => "array", "items" => { "type" => Attempt.wcif_json_schema } },
      },
    }
  end
end

class Attempt
  include ActiveModel::Validations

  attr_accessor :result, :reconstruction
  validates :result, numericality: { only_integer: true }
  validates :reconstruction, numericality: { only_integer: true }

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
        "reconstruction" => { "type" => "string" },
      },
    }
  end
end
