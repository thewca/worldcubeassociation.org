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

  def initialize(r)
    @id = r["id"]
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
    @country = Country.c_find(r["countryId"])
    @format = Format.c_find(r["formatId"])
    @round_type = RoundType.c_find(r["roundTypeId"])
    @event = Event.c_find(r["eventId"])
  end

  def eventId
    event.id
  end

  def roundTypeId
    round_type.id
  end
end
