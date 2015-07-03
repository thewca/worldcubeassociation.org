class Result < ActiveRecord::Base
  self.table_name = "Results"

  def to_s(field)
    value = send field

    # Special cases.
    if value < -2
      throw "Unrecognized value: #{value}"
    elsif value == -2
      return "DNS"
    elsif value == -1
      return "DNF"
    elsif value == 0
      return ""
    end

    if eventId == '333fm'
      if field == :average
        # The average field for 333fm is pretty weird. It's the sum
        # of the solves, multiplied by 100 and rounded to the nearest integer.
        return "%.2f" % ( value / 100.0 )
      end
      # Otherwise, value is simply the number of moves.
      return value.to_s
    end

    if eventId == '333mbf' || eventId == '333mbo'
      # Extract value parts.
      old = value / 1000000000 != 0
      if old
        time = value % 100000
        value = value / 100000
        attempted = value % 100
        value = value / 100
        solved = 99 - value % 100
        value = value / 100
      else
        missed = value % 100
        value = value / 100
        time = value % 100000
        value = value / 100000
        difference = 99 - ( value % 100 )
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

    time_centiseconds = value
    hours = time_centiseconds / 360000
    minutes = (time_centiseconds % 360000) / 6000
    seconds = (time_centiseconds % 6000) / 100
    centis = time_centiseconds % 100
    ("%d:%02d:%02d.%02d" % [ hours, minutes, seconds, centis ]).sub(/^[0:]*/, '')
  end
end
