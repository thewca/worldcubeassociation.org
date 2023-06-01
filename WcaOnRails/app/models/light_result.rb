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
              :person_name,
              :event,
              :format,
              :id,
              :round_type,
              :pos,
              :person_id,
              :regional_single_record,
              :regional_average_record,
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
    @person_name = r["person_name"]
    @pos = r["pos"]
    @person_id = r["person_id"]
    @regional_single_record = r["regional_single_record"]
    @regional_average_record = r["regional_average_record"]
    @country = Country.c_find(r["country_id"])
    @format = Format.c_find(r["format_id"])
    @round_type = RoundType.c_find(r["round_type_id"])
    @event = Event.c_find(r["event_id"])
  end

  def event_id
    event.id
  end

  def round_type_id
    round_type.id
  end
end
