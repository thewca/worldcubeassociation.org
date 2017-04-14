# frozen_string_literal: true

require 'solve_time'

# This is an alternative to `Result` used for performance reasons.
# See also the comment in `app/models/competition.rb`.
class LightResult
  include ResultMethods

  attr_accessor :muted

  attr_reader :value1,
              :value2,
              :value3,
              :value4,
              :value5,
              :best,
              :average,
              :personName,
              :event,
              :event,
              :format,
              :round_type,
              :pos,
              :personId,
              :regionalSingleRecord,
              :regionalAverageRecord,
              :country

  def initialize(r, country, format, round_type, event)
    @value1 = r["value1"]
    @value2 = r["value2"]
    @value3 = r["value3"]
    @value4 = r["value4"]
    @value5 = r["value5"]
    @best = r["best"]
    @average = r["average"]
    @personName = r["personName"]
    @pos = r["pos"]
    @personId = r["personId"]
    @regionalSingleRecord = r["regionalSingleRecord"]
    @regionalAverageRecord = r["regionalAverageRecord"]
    @country = country
    @format = format
    @round_type = round_type
    @event = event
  end

  def eventId
    event.id
  end

  def roundTypeId
    round_type.id
  end
end
