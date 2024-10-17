# frozen_string_literal: true

class QualificationResultsFaker
  attr_accessor :qualification_results

  def initialize(
    date = (Time.now.utc-1).iso8601,
    results_inputs = [
      ['222', 'single', '200'],
      ['333', 'single', '900'],
      ['pyram', 'single', '1625'],
      ['555', 'average', '5000'],
      ['555bf', 'average', '189700'],
      ['minx', 'average', '13887'],
    ]
  )
    @date = date
    @qualification_results = results_inputs.map do |input|
      qualification_data(input[0], input[1], input[2], @date)
    end
  end

  def qualification_data(event, type, time, date)
    {
      eventId: event,
      type: type,
      best: time,
      on_or_before: date,
    }
  end
end
