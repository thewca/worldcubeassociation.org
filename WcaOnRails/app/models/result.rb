# frozen_string_literal: true
class Result < ActiveRecord::Base
  include ResultMethods

  self.table_name = "Results"

  belongs_to :competition, foreign_key: :competitionId
  belongs_to :country, foreign_key: :countryId
  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  belongs_to :round, foreign_key: :roundId
  belongs_to :event, foreign_key: :eventId
  belongs_to :format, foreign_key: :formatId

  scope :podium, -> { joins(:round).merge(Round.final_rounds).where(pos: [1..3]).where("best > 0") }
  scope :winners, -> { joins(:round, :event).merge(Round.final_rounds).where("pos = 1 and best > 0").order("Events.rank") }

  validate :validate_each_solve
  def validate_each_solve
    solve_times.each_with_index do |solve_time, i|
      unless solve_time.valid?
        errors.add(:"value#{i + 1}", solve_time.errors.messages[:base].join(" "))
      end
    end
  end

  validate :validate_best
  def validate_best
    correct_best_solve_time = sorted_solves.first
    if correct_best_solve_time && correct_best_solve_time.wca_value != best
      errors.add(:best, "should be #{correct_best_solve_time.wca_value}")
    end
  end

  def hlp
    ActionController::Base.helpers
  end

  validate :validate_number_of_solves
  def validate_number_of_solves
    return errors.add(:competitionId, "invalid") unless competition
    return errors.add(:countryId, "invalid") unless country
    return errors.add(:roundId, "invalid") unless round
    return errors.add(:eventId, "invalid") unless event
    return errors.add(:formatId, "invalid") unless format
    return errors.add(:base, "Cannot skip all solves.") if solve_times.all?(&:skipped?)

    last_unskipped_index = solve_times.rindex(&:unskipped?) || 0
    first_skipped_index = solve_times.index(&:skipped?) || Float::INFINITY
    return "Skipped solves must all come at the end." if last_unskipped_index > first_skipped_index

    unskipped_count = solve_times.length - solve_times.count(&:skipped?)
    if round.combined?
      if unskipped_count > format.expected_solve_count
        return errors.add(:base, "Expected at most #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}.")
      end
    else
      if unskipped_count != format.expected_solve_count
        return errors.add(:base, "Expected #{hlp.pluralize(format.expected_solve_count, 'solve')}, but found #{unskipped_count}.")
      end
    end
  end

  validate :validate_average
  def validate_average
    # Don't try to validate the average unless everything else is correct.
    # It doesn't make sense to try to compute the average unless the result
    # has the correct number of solves in it.
    return unless errors.blank?

    if eventId == "333fm"
      sum_moves = counting_solve_times.sum(&:move_count)
      correct_average_wca_value = 100 * sum_moves / counting_solve_times.length
    else
      sum_centis = counting_solve_times.sum(&:time_centiseconds)
      correct_average_wca_value = sum_centis / counting_solve_times.length
    end

    if correct_average_wca_value != average
      errors.add(:average, "should be #{correct_average_wca_value}")
    end
  end

  def to_s(field)
    SolveTime.new(eventId, field, send(field)).clock_format
  end
end
