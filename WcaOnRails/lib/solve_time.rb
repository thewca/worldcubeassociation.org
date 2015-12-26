class SolveTime
  def initialize(event_id, field, wca_value)
    @event_id = event_id
    @field = field
    @wca_value = wca_value
  end

  def clock_format
    wca_value = @wca_value
    # Special cases.
    if wca_value < -2
      throw "Unrecognized wca_value: #{wca_value}"
    elsif wca_value == -2
      return "DNS"
    elsif wca_value == -1
      return "DNF"
    elsif wca_value == 0
      return ""
    end

    if @event_id == '333fm'
      if @field == :average
        # The average field for 333fm is pretty weird. It's the sum
        # of the solves, multiplied by 100 and rounded to the nearest integer.
        return "%.2f" % ( wca_value / 100.0 )
      end
      # Otherwise, wca_value is simply the number of moves.
      return wca_value.to_s
    end

    if @event_id == '333mbf' || @event_id == '333mbo'
      # Extract wca_value parts.
      old = wca_value / 1000000000 != 0
      if old
        time = wca_value % 100000
        wca_value = wca_value / 100000
        attempted = wca_value % 100
        wca_value = wca_value / 100
        solved = 99 - wca_value % 100
        wca_value = wca_value / 100
      else
        missed = wca_value % 100
        wca_value = wca_value / 100
        time = wca_value % 100000
        wca_value = wca_value / 100000
        difference = 99 - ( wca_value % 100 )
        solved = difference + missed
        attempted = solved + missed
      end

      # Build time string.
      if time == 99999
        result = '?:??:??'
      else
        result = ""
        while time >= 60
          result = ":%02d#{result}" % ( time % 60 )
          time = time / 60
        end
        result = "#{time}#{result}"
      end

      return "#{solved}/#{attempted} #{result}"
    end

    time_centiseconds = wca_value
    hours = time_centiseconds / 360000
    minutes = (time_centiseconds % 360000) / 6000
    seconds = (time_centiseconds % 6000) / 100
    centis = time_centiseconds % 100
    ("%d:%02d:%02d.%02d" % [ hours, minutes, seconds, centis ]).sub(/^[0:]*/, '')
  end
end
