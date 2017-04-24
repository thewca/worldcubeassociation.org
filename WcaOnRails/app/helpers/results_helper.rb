# frozen_string_literal: true

module ResultsHelper
  def solve_tds_for_result(result)
    trimmed_indices = result.trimmed_indices
    best_index = result.best_index
    worst_index = result.worst_index
    result.solve_times.each_with_index.map do |solve_time, i|
      classes = ["solve#{i + 1}"]
      classes << "trimmed" if trimmed_indices.include?(i)
      classes << "best" if i == best_index
      classes << "worst" if i == worst_index
      content_tag :td, solve_time.clock_format, class: classes.join(' ')
    end.reduce(:+)
  end
end
