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

  def initialize(result_data)
    @id = result_data["id"]
    @value1 = result_data["value1"]
    @value2 = result_data["value2"]
    @value3 = result_data["value3"]
    @value4 = result_data["value4"]
    @value5 = result_data["value5"]
    @best = result_data["best"]
    @average = result_data["average"]
    @personName = result_data["personName"]
    @pos = result_data["pos"]
    @personId = result_data["personId"]
    @regionalSingleRecord = result_data["regionalSingleRecord"]
    @regionalAverageRecord = result_data["regionalAverageRecord"]
    @country = Country.c_find(result_data["countryId"])
    @format = Format.c_find(result_data["formatId"])
    @round_type = RoundType.c_find(result_data["roundTypeId"])
    @event = Event.c_find(result_data["eventId"])
  end

  def eventId
    event.id
  end

  def roundTypeId
    round_type.id
  end
end
