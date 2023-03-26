# frozen_string_literal: true

require 'active_support/concern'

module Resultable
  extend ActiveSupport::Concern
  include ResultMethods

  included do
    # NOTE: We use cached values instead of belongs_to to improve performances.
    belongs_to :competition, foreign_key: :competitionId
    alias_attribute :competition_id, :competitionId
    belongs_to :round_type, foreign_key: :roundTypeId
    alias_attribute :round_type_id, :roundTypeId
    # FIXME: shouldn't we take advantage of the fact that these are cached?
    belongs_to :event, foreign_key: :eventId
    alias_attribute :event_id, :eventId
    belongs_to :format, foreign_key: :formatId
    alias_attribute :format_id, :formatId

    # Forgetting to synchronize the results in WCA Live is a very common mistake,
    # so this error message is hinting the user to check that, even if it's
    # outside the scope of the WCA website.
    validates_numericality_of :pos, message: "The position is not a valid number. Did you clear all the empty rows and synchronized WCA Live?"

    # Order by event, then roundTypeId, then average if exists, then best if exists
    scope :sorted_for_competitions,
          ->(competition_ids) { includes(:format).where(competitionId: competition_ids).order(:competitionId).merge(Result.sorted) }
    scope :sorted, -> { order(:eventId, :roundTypeId).order(Arel.sql("IF(formatId IN ('a','m') AND average>0, average, 2147483647), IF(best>0, best, 2147483647)")) }

    # Define cached stuff with the same name as the associations for validation
    def round_type
      RoundType.c_find(roundTypeId)
    end

    def event
      Event.c_find(eventId)
    end

    def format
      Format.c_find(formatId)
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
        .find_by_id(competition_id)
        &.find_round_for(event_id, round_type_id, format_id)
    end

    validate :belongs_to_a_round
    def belongs_to_a_round
      if round.blank?
        errors.add(:round_type,
                   "Result must belong to a valid round. Please check that the tuple (competitionId, eventId, roundTypeId, formatId) matches an existing round.")
      end
    end

    validate :validate_each_solve, if: :event
    def validate_each_solve
      solve_times.each_with_index do |solve_time, i|
        unless solve_time.valid?
          errors.add(:"value#{i + 1}", solve_time.errors.full_messages.join(" "))
        end
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

    unless solve_times.drop_while(&:unskipped?).all?(&:skipped?)
      return "Skipped solves must all come at the end."
    end

    unskipped_count = solve_times.count(&:unskipped?)
    if round_type.combined?
      if unskipped_count > format.expected_solve_count
        "Expected at most #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}."
      end
    else
      if unskipped_count != format.expected_solve_count
        "Expected #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}."
      end
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
    formatId == "a" || formatId == "m" || (formatId == "3" && %(333ft 333fm 333bf 444bf 555bf).include?(eventId))
  end

  def compute_correct_best
    best_solve = sorted_solves.first
    best_solve ? best_solve.wca_value : 0
  end

  def compute_correct_average
    if average_is_not_computable_reason || missed_combined_round_cutoff? || !should_compute_average?
      0
    else
      if counting_solve_times.any?(&:incomplete?)
        SolveTime::DNF_VALUE
      elsif eventId == "333fm"
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
  end

  def to_solve_time(field)
    SolveTime.new(eventId, field, send(field))
  end

  def to_s(field)
    to_solve_time(field).clock_format
  end

  def hlp
    ActionController::Base.helpers
  end
end
