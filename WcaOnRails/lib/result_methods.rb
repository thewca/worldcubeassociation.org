# frozen_string_literal: true

module ResultMethods
  def wca_id
    @personId || self.personId
  end

  def best_solve
    SolveTime.new(eventId, :single, best)
  end

  def average_solve
    SolveTime.new(eventId, :average, average)
  end

  def best_index
    sorted_solves_with_index.min[1]
  end

  def missed_combined_round_cutoff?
    sorted_solves_with_index.length < format.expected_solve_count
  end

  private def sorted_solves
    @sorted_solves ||= solve_times.reject(&:skipped?).sort.freeze
  end

  private def sorted_solves_with_index
    @sorted_solves_with_index ||= solve_times.each_with_index.reject { |s, _| s.skipped? }.sort.freeze
  end

  def solve_times
    @solve_times ||= [SolveTime.new(eventId, :single, value1),
                      SolveTime.new(eventId, :single, value2),
                      SolveTime.new(eventId, :single, value3),
                      SolveTime.new(eventId, :single, value4),
                      SolveTime.new(eventId, :single, value5)].freeze
  end

  def worst_index
    sorted_solves_with_index.max[1]
  end

  def trimmed_indices
    if missed_combined_round_cutoff?
      # When you miss the cutoff for a cutoff round, you don't
      # get an average, therefore none of the solves were trimmed.
      []
    else
      sorted_solves = sorted_solves_with_index
      trimmed_solves_with_index = sorted_solves[0...format.trim_fastest_n]
      trimmed_solves_with_index += sorted_solves[(sorted_solves.length - format.trim_slowest_n)...sorted_solves.length]
      trimmed_solves_with_index.map { |_, i| i }
    end
  end

  def counting_solve_times
    unless @counting
      @counting = []
      solve_times.each_with_index do |solve_time, i|
        if !trimmed_indices.include?(i) && i < format.expected_solve_count
          @counting << solve_time
        end
      end
    end
    @counting
  end

  # When someone changes an attribute, clear our cached values.
  def _write_attribute(attr, value)
    @sorted_solves_with_index = nil
    @solve_times = nil
    @counting = nil
    super
  end
end
