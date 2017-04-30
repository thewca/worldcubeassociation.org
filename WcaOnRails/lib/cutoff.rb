# frozen_string_literal: true

class Cutoff
  attr_accessor :numberOfAttempts, :attemptValue, :event
  def initialize(numberOfAttempts: nil, attemptValue: nil, event: nil)
    self.numberOfAttempts = numberOfAttempts
    self.attemptValue = attemptValue
    self.event = event
  end

  def to_wcif
    { "numberOfAttempts" => self.numberOfAttempts, "attemptValue" => self.attemptValue }
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
        cutoff.numberOfAttempts = json_obj['numberOfAttempts']
        cutoff.attemptValue = json_obj['attemptValue']
      end
    end
  end

  def self.dump(cutoff)
    cutoff ? JSON.dump(cutoff.to_wcif) : nil
  end
end
