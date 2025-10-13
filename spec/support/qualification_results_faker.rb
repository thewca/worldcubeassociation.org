# frozen_string_literal: true

class QualificationResultsFaker
  attr_accessor :qualification_results

  def initialize(
    date = (Time.now.utc - 1).iso8601,
    results_inputs = [
      %w[222 single 200],
      %w[333 single 900],
      %w[pyram single 1625],
      %w[555 average 5000],
      %w[555bf average 189700],
      %w[minx average 13887],
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
