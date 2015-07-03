class Result < ActiveRecord::Base
  self.table_name = "Results"

  def to_s(field)
    # TODO port stuff from webroot/results/includes/_values.php:formatValue()
    case field
    when :average
      average.to_s
    when :best
      best.to_s
    else
      throw "Unrecognized field: #{field}"
    end
  end
end
