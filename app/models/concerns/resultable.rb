# frozen_string_literal: true

require 'active_support/concern'

module Resultable
  extend ActiveSupport::Concern

  included do
    # NOTE: We use cached values instead of belongs_to to improve performances.
    belongs_to :competition
    belongs_to :round_type
    belongs_to :event
    belongs_to :format

    # Forgetting to synchronize the results in WCA Live is a very common mistake,
    # so this error message is hinting the user to check that, even if it's
    # outside the scope of the WCA website.
    validates :pos, numericality: { message: "The position is not a valid number. Did you clear all the empty rows and synchronized WCA Live?" }

    # Define cached stuff with the same name as the associations for validation
    def round_type
      RoundType.c_find(round_type_id)
    end

    def event
      Event.c_find(event_id)
    end

    def format
      Format.c_find(format_id)
    end

    def round
      # This method is actually relatively expensive, it's definitely fine to
      # use it if you're dealing with a single result, but if you're manipulating
      # a bunch of them please don't use it as you likely have another mean
      # to get a 'round' for your set of results.
      # Using a 'find' here is intentional to pass the `includes(:rounds)` to
      # avoid the n+1 query on competition_events if we were directly using
      # competition.find_round_for.
      Competition
        .includes(:rounds)
        .find_by(id: competition_id)
        &.find_round_for(event_id, round_type_id, format_id)
    end

    validate :belongs_to_a_round
    def belongs_to_a_round
      return if round.present?

      errors.add(:round_type,
                 "Result must belong to a valid round. Please check that the tuple (competition_id, event_id, round_type_id, format_id) matches an existing round.")
    end

    validate :validate_each_solve, if: :event
    def validate_each_solve
      solve_times.each_with_index do |solve_time, i|
        errors.add(:"value#{i + 1}", solve_time.errors.full_messages.join(" ")) unless solve_time.valid?
      end
    end

    validate :validate_solve_count, if: :event
    def validate_solve_count
      errors.add(:base, invalid_solve_count_reason) if invalid_solve_count_reason
    end

    validate :validate_average
    def validate_average
      return if average_is_not_computable_reason

      correct_average = compute_correct_average
      errors.add(:average, "should be #{correct_average}") if correct_average != average
    end

    validate :validate_best, if: :event
    def validate_best
      correct_best = compute_correct_best
      errors.add(:best, "should be #{correct_best}") if correct_best != best
    end
  end

  def invalid_solve_count_reason
    return "Invalid format" unless format
    return "Invalid round_type" unless round_type
    return "All solves cannot be DNS/skipped." if solve_times.all? { |s| s.dns? || s.skipped? }

    return "Skipped solves must all come at the end." unless solve_times.drop_while(&:unskipped?).all?(&:skipped?)

    unskipped_count = solve_times.count(&:unskipped?)
    if round_type.combined?
      "Expected at most #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}." if unskipped_count > format.expected_solve_count
    elsif unskipped_count != format.expected_solve_count
      "Expected #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}."
    end
  end

  def average_is_not_computable_reason
    # To compute the average, we need to have a valid number of solves,
    # and we need to know what event we are dealing with (because
    # 333fm is computed differently than other events).
    event ? invalid_solve_count_reason : "Event needed to compute average"
  end

  def should_compute_average?
    # Average of 5 and Mean of 3 rounds should definitely attempt to compute the average (the average
    # may still be empty because of cutoff rounds).
    # Best of 3 is weird. We actually do want to populate the average column for best of 3 with:
    #  - 333fm was changed from allowing best of 3 (and disallowing mean of 3) to allowing mean of 3 (and disallowing best of 3).
    #    See "Relevant regulations changes" below.
    #    With this change in format, the Board decided to compute means for all
    #    the old best of 3 rounds, and assign mean records to them.
    #    However, we could not change the format of the rounds, as that would have affected rankings
    #    in past competitions, so the rounds remain as best of 3, but with an average computed.
    #  - 333ft has a similar story to 333fm. It also changed from allowing best of 3
    #    (and disallowing mean of 3) to allowing mean of 3 (and disallowing best
    #    of 3). See "Relevant regulations changes" below.
    #  - 333bf is quite a special case. At competitions, competitors are ranked according to best of 3, but
    #    the WCA awards records on both single and mean of 3.
    #    See https://www.worldcubeassociation.org/regulations/#9b3b.

    # Relevant regulations changes:
    #  - August 28, 2012 (beginning of the regulations on github): https://github.com/thewca/wca-regulations/commit/0c7f3e0501970c84178d914cd41a0d488ad3fac1
    #    - 333ft introduced with legal formats "123a".
    #  - September 9, 2012: https://github.com/thewca/wca-regulations/commit/6e5c44f0e397b735549923ff538846d3c4387dd4
    #    - 333ft legal formats changed from "123a" to "123m".
    #  - December 7, 2013: https://github.com/thewca/wca-regulations/commit/dc182c84e2ef60aeba37f5af896bd67f4c459575
    #    - 333fm legal formats changed from "123" to "123m".
    #  - December 9, 2013: https://github.com/thewca/wca-regulations/issues/109 and https://github.com/thewca/wca-regulations/commit/80ebf04e3ed0752df8047f4428277bf186f374c2
    #    - All events that allow "mean of 3" no longer allow "best of 3".
    #  - May 1, 2019
    #    - 444bf and 555bf mean are officially recognized
    format_id == "a" || format_id == "m" || (format_id == "3" && %(333ft 333fm 333bf 444bf 555bf).include?(event_id))
  end

  def compute_correct_best
    best_solve = sorted_solves.first
    best_solve ? best_solve.wca_value : 0
  end

  def compute_correct_average
    if average_is_not_computable_reason || missed_combined_round_cutoff? || !should_compute_average?
      0
    elsif counting_solve_times.any?(&:incomplete?)
      SolveTime::DNF_VALUE
    elsif event_id == "333fm"
      sum_moves = counting_solve_times.sum(&:move_count).to_f
      (100 * sum_moves / counting_solve_times.length).round
    else
      # Cast at least one of the operands to float
      sum_centis = counting_solve_times.sum(&:time_centiseconds).to_f
      raw_average = sum_centis / counting_solve_times.length
      # Round the result.
      # If the average is above 10 minutes, round it to the nearest second as per
      # https://www.worldcubeassociation.org/regulations/#9f2
      raw_average > 60_000 ? raw_average.round(-2) : raw_average.round
    end
  end

  def to_solve_time(field)
    SolveTime.new(event_id, field, send(field))
  end

  def to_s(field)
    to_solve_time(field).clock_format
  end

  def hlp
    ActionController::Base.helpers
  end

  alias_attribute :wca_id, :person_id

  def best_solve
    SolveTime.new(event_id, :single, best)
  end

  def average_solve
    SolveTime.new(event_id, :average, average)
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
    @solve_times ||= [SolveTime.new(event_id, :single, value1),
                      SolveTime.new(event_id, :single, value2),
                      SolveTime.new(event_id, :single, value3),
                      SolveTime.new(event_id, :single, value4),
                      SolveTime.new(event_id, :single, value5)].freeze
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
    @counting_solve_times ||= solve_times.each_with_index.filter_map do |solve_time, i|
      solve_time if i < format.expected_solve_count && trimmed_indices.exclude?(i)
    end
  end

  # When someone changes an attribute, clear our cached values.
  def _write_attribute(attr, value)
    @sorted_solves_with_index = nil
    @solve_times = nil
    @counting_solve_times = nil
    super
  end
end
