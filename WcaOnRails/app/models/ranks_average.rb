class RanksAverage < ActiveRecord::Base
  self.table_name = "RanksAverage"

  def to_s(field)
    SolveTime.new(eventId, :average, send(field)).clock_format
  end
end
