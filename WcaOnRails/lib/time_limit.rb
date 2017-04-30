# frozen_string_literal: true

class TimeLimit
  TEN_MINUTES_IN_CENTISECONDS = 10*60*100

  attr_accessor :centiseconds, :cumulative_round_ids
  def initialize(centiseconds: TEN_MINUTES_IN_CENTISECONDS, cumulative_round_ids: [].freeze)
    self.centiseconds = centiseconds
    self.cumulative_round_ids = cumulative_round_ids
  end

  def to_wcif
    { "centiseconds" => self.centiseconds, "cumulative_round_ids" => self.cumulative_round_ids }
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
        json_obj = JSON.parse(json)
        time_limit.cumulative_round_ids = json_obj['cumulative_round_ids']
        time_limit.centiseconds = json_obj['centiseconds']
      end
    end
  end

  def self.dump(time_limit)
    time_limit ? JSON.dump(time_limit.to_wcif) : nil
  end
end
