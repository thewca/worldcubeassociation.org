class SolveTime
  include Comparable

  attr_reader :wca_value
  def initialize(event_id, field, wca_value)
    raise "Unrecognized wca_value: #{wca_value}" if wca_value < -2
    @event_id = event_id
    @field = field
    @wca_value = wca_value
  end

  DNF_VALUE = -1
  DNF = SolveTime.new(nil, nil, DNF_VALUE)
  DNS_VALUE = -2
  DNS = SolveTime.new(nil, nil, DNS_VALUE)
  SKIPPED_VALUE = 0
  SKIPPED = SolveTime.new(nil, nil, SKIPPED_VALUE)

  def dn?
    dnf? || dns?
  end

  def dns?
    wca_value == DNS_VALUE
  end

  def dnf?
    wca_value == DNF_VALUE
  end

  def skipped?
    wca_value == SKIPPED_VALUE
  end

  def to_orderable
    [
      self.skipped? ? 0 : 1,
      self.dns? ? 0 : 1,
      self.dnf? ? 0 : 1,
      self.wca_value,
    ]
  end

  def <=>(o)
    self.to_orderable <=> o.to_orderable
  end

  def clock_format
    if dns?
      return "DNS"
    elsif dnf?
      return "DNF"
    elsif skipped?
      return ""
    end

    if @event_id == '333fm'
      if @field == :average
        # The average field for 333fm is pretty weird. It's the sum
        # of the solves, multiplied by 100 and rounded to the nearest integer.
        return "%.2f" % ( wca_value / 100.0 )
      end

      # Otherwise, wca_value is simply the number of moves.
      wca_value.to_s

    elsif @event_id == '333mbf' || @event_id == '333mbo'

      mb_value = wca_value
      # Extract wca_value parts.
      old = mb_value / 1000000000 != 0
      if old
        time = mb_value % 100000
        mb_value = mb_value / 100000
        attempted = mb_value % 100
        mb_value = mb_value / 100
        solved = 99 - mb_value % 100
        mb_value = mb_value / 100
      else
        missed = mb_value % 100
        mb_value = mb_value / 100
        time = mb_value % 100000
        mb_value = mb_value / 100000
        difference = 99 - ( mb_value % 100 )
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

      "#{solved}/#{attempted} #{result}"

    else

      time_centiseconds = wca_value
      hours = time_centiseconds / 360000
      minutes = (time_centiseconds % 360000) / 6000
      seconds = (time_centiseconds % 6000) / 100
      centis = time_centiseconds % 100

      clock_format = ("%d:%02d:%02d.%02d" % [ hours, minutes, seconds, centis ]).sub(/^[0:]*/, '')
      if clock_format.starts_with? "."
        clock_format = "0" + clock_format
      end
      clock_format
    end

  end
end
