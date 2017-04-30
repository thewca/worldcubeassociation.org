# frozen_string_literal: true

class AdvanceToNextRoundRequirement
  attr_accessor :type, :ranking, :percentile, :attemptValue
  def initialize(type: nil, ranking: nil, percentile: nil, attemptValue: nil)
    self.type = type
    self.ranking = ranking
    self.percentile = percentile
    self.attemptValue = attemptValue
  end

  def type=(new_type)
    if [nil, "ranking", "percentile", "attemptValue"].include?(new_type)
      @type = new_type
    end
  end

  def to_wcif
    { "type" => self.type, self.type => send(self.type) }
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
      self.new.tap do |cutoff|
        json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
        cutoff.type = json_obj['type']
        cutoff.ranking = json_obj['ranking']
        cutoff.percentile = json_obj['percentile']
        cutoff.attemptValue = json_obj['attemptValue']
      end
    end
  end

  def self.dump(cutoff)
    cutoff ? JSON.dump(cutoff.to_wcif) : nil
  end
end
