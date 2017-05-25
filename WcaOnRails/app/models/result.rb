# frozen_string_literal: true

class Result < ApplicationRecord
  include ResultMethods

  self.table_name = "Results"

  belongs_to :competition, foreign_key: :competitionId
  belongs_to :country, foreign_key: :countryId
  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  belongs_to :round_type, foreign_key: :roundTypeId
  belongs_to :event, foreign_key: :eventId
  belongs_to :format, foreign_key: :formatId

  scope :podium, -> { joins(:round_type).merge(RoundType.final_rounds).where(pos: [1..3]).where("best > 0") }
  scope :winners, -> { joins(:round_type, :event).merge(RoundType.final_rounds).where("pos = 1 and best > 0").order("Events.rank") }

  validate :validate_each_solve
  def validate_each_solve
    solve_times.each_with_index do |solve_time, i|
      unless solve_time.valid?
        errors.add(:"value#{i + 1}", solve_time.errors.messages[:base].join(" "))
      end
    end
  end

  validates :competition, presence: true
  validates :country, presence: true
  validates :event, presence: true
  validates :round_type, presence: true
  validates :format, presence: true

  validate :validate_solve_count
  def validate_solve_count
    # We need to know the round_type and the format in order to validate the number of solves.
    if round_type && format
      errors.add(:base, invalid_solve_count_reason) if invalid_solve_count_reason
    end
  end

  validate :validate_average
  def validate_average
    return if average_is_not_computable_reason

    correct_average = compute_correct_average
    errors.add(:average, "should be #{correct_average}") if correct_average != average
  end

  validate :validate_best
  def validate_best
    correct_best = compute_correct_best
    errors.add(:best, "should be #{correct_best}") if correct_best != best
  end

  def invalid_solve_count_reason
    return "Invalid format" unless format
    return "Invalid round_type" unless round_type
    return "Cannot skip all solves." if solve_times.all?(&:skipped?)

    unless solve_times.drop_while(&:unskipped?).all?(&:skipped?)
      return "Skipped solves must all come at the end."
    end

    unskipped_count = solve_times.count(&:unskipped?)
    if round_type.combined?
      if unskipped_count > format.expected_solve_count
        return "Expected at most #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}."
      end
    else
      if unskipped_count != format.expected_solve_count
        return "Expected #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}."
      end
    end
  end

  def average_is_not_computable_reason
    # To compute the average, we need to have a valid number of solves,
    # and we need to know what event we are dealing with (because
    # 333fm is computed differently than other events).
    event ? invalid_solve_count_reason : "Event needed to compute average"
  end

  def compute_correct_best
    best_solve = sorted_solves.first
    best_solve ? best_solve.wca_value : 0
  end

  def compute_correct_average
    if average_is_not_computable_reason || missed_combined_round_cutoff?
      0
    else
      if eventId == "333fm"
        sum_moves = counting_solve_times.sum(&:move_count)
        100 * sum_moves / counting_solve_times.length
      else
        sum_centis = counting_solve_times.sum(&:time_centiseconds)
        sum_centis / counting_solve_times.length
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
