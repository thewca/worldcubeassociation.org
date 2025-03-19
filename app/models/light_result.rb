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
              :format,
              :id,
              :round_type,
              :pos,
              :personId,
              :regionalSingleRecord,
              :regionalAverageRecord,
              :country

  def initialize(params)
    @id = params["id"]
    @value1 = params["value1"]
    @value2 = params["value2"]
    @value3 = params["value3"]
    @value4 = params["value4"]
    @value5 = params["value5"]
    @best = params["best"]
    @average = params["average"]
    @personName = params["personName"]
    @pos = params["pos"]
    @personId = params["personId"]
    @regionalSingleRecord = params["regionalSingleRecord"]
    @regionalAverageRecord = params["regionalAverageRecord"]
    @country = Country.c_find(params["countryId"])
    @format = Format.c_find(params["formatId"])
    @round_type = RoundType.c_find(params["roundTypeId"])
    @event = Event.c_find(params["eventId"])
  end

  def eventId
    event.id
  end

  def roundTypeId
    round_type.id
  end
end
