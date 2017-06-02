# frozen_string_literal: true

module ResultsHelper
  def solve_tds_for_result(result)
    result.solve_times.each_with_index.map do |solve_time, i|
      classes = ["solve", i.to_s]
      classes << "trimmed" if result.trimmed_indices.include?(i)
      classes << "best" if i == result.best_index
      classes << "worst" if i == result.worst_index
      content_tag :td, solve_time.clock_format, class: classes.join(' ')
    end.reduce(:+)
  end

  # Note: PB markers are computed in the order in which results are given.
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

  def link_to_ranking(event_id, type, &block)
    url = "/results/events.php?eventId=#{event_id}&#{type}=true"
    link_to url, class: "plain", &block
  end
end
