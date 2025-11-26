# frozen_string_literal: true

module ResultsHelper
  def solve_tds_for_result(result)
    # It's ok to use map + reduce (:+) here because this is not an Integer
    # rubocop:disable Performance/Sum
    completed_solves = result.solve_times.each_with_index.map do |solve_time, i|
      classes = ["solve", i.to_s]
      classes << "trimmed" if result.trimmed_indices.include?(i)
      classes << "best" if i == result.best_index
      classes << "worst" if i == result.worst_index
      content_tag :td, solve_time.clock_format, class: classes.join(' ')
    end.reduce(:+)

    # Currently there are always 5 solves in any results, even for mean of 3 or Bo1
    # That's why we always need to fill it up with 5 tds
    missing_solves = 5 - result.solve_times.length
    return completed_solves + Array.new(missing_solves, content_tag(:td)).reduce(:+) if missing_solves != 0

    completed_solves
    # rubocop:enable Performance/Sum
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
