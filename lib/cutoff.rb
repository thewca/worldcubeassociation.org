# frozen_string_literal: true

class Cutoff
  include ActiveModel::Validations

  attr_accessor :number_of_attempts, :attempt_result, :event
  validates :number_of_attempts, numericality: { only_integer: true }
  validates :attempt_result, numericality: { only_integer: true }

  def initialize(number_of_attempts: nil, attempt_result: nil, event: nil)
    self.number_of_attempts = number_of_attempts
    self.attempt_result = attempt_result
    self.event = event
  end

  def to_wcif
    { 'numberOfAttempts' => self.number_of_attempts, 'attemptResult' => self.attempt_result }
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
        cutoff.number_of_attempts = json_obj['numberOfAttempts']
        cutoff.attempt_result = json_obj['attemptResult']
      end
    end
  end

  def self.dump(cutoff)
    cutoff ? JSON.dump(cutoff.to_wcif) : nil
  end

  def self.wcif_json_schema
    {
      'type' => ['object', 'null'],
      'properties' => {
        'numberOfAttempts' => { 'type' => 'integer' },
        'attemptResult' => { 'type' => 'integer' },
      },
    }
  end

  def to_s(round, short: false)
    if round.event.timed_event?
      time = SolveTime.centiseconds_to_clock_format(self.attempt_result)
      short ? time : I18n.t('cutoff.time', count: self.number_of_attempts, time: time)
    elsif round.event.fewest_moves?
      moves = self.attempt_result
      short ? moves : I18n.t('cutoff.moves', count: self.number_of_attempts, moves: moves)
    elsif round.event.multiple_blindfolded?
      points = SolveTime.multibld_attempt_to_points(self.attempt_result)
      short ? points : I18n.t('cutoff.points', count: self.number_of_attempts, points: points)
    else
      raise "Unrecognized event: #{round.event.id}"
    end
  end
end
