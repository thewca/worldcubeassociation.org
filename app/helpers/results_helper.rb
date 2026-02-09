# frozen_string_literal: true

module ResultsHelper
  def solve_tds_for_result(result)
    # It's ok to use map + reduce (:+) here because this is not an Integer
    # rubocop:disable Performance/Sum
    if result.format_id == "h"
      # 5 blank spaces as we don't display H2H results yet
      5.times.map do
        content_tag :td
      end.join.html_safe
    else
      result.solve_times.each_with_index.map do |solve_time, i|
        classes = ["solve", i.to_s]
        classes << "trimmed" if result.trimmed_indices.include?(i)
        classes << "best" if i == result.best_index
        classes << "worst" if i == result.worst_index
        content_tag :td, solve_time.clock_format, class: classes.join(' ')
      end.reduce(:+)
      # rubocop:enable Performance/Sum
    end
  end

  # NOTE: PB markers are computed in the order in which results are given.
  def historical_pb_markers(results)
    Hash.new { |hash, key| hash[key] = {} }.tap do |markers|
      pb_single = results.first.best_solve
      pb_average = results.first.average_solve
      results.each do |result|
        if result.best_solve.complete? && result.best_solve <= pb_single
          pb_single = result.best_solve
          markers[result.id][:single] = true
        end
        if result.average_solve.complete? && result.average_solve <= pb_average
          pb_average = result.average_solve
          markers[result.id][:average] = true
        end
      end
    end
  end

  def pb_type_class_for_result(regional_record, pb_marker)
    if pb_marker
      record_class = 'pb'
      if regional_record.present?
        record_class = case regional_record
                       when 'WR'
                         'wr'
                       when 'NR'
                         'nr'
                       else
                         'cr'
                       end
      end
    end
    record_class
  end
end
