require 'solve_time'

class Result < ActiveRecord::Base
  self.table_name = "Results"

  # For some reason, alias_method isn't working for me here.
  def wca_id
    personId
  end

  belongs_to :competition, foreign_key: :competitionId
  belongs_to :person, foreign_key: :personId

  attr_accessor :tied_previous
  attr_accessor :muted

  def event
    Event.find(eventId)
  end

  def round
    Round.find(roundId)
  end

  def format
    Format.find_by_id(formatId)
  end

  def average_solve
    SolveTime.new(eventId, :average, average)
  end

  def best_solve
    SolveTime.new(eventId, :single, best)
  end

  def best_index
    sorted_solves_with_index.min[1]
  end

  def worst_index
    sorted_solves_with_index.max[1]
  end

  def missed_combined_round_cutoff?
    sorted_solves_with_index.length < format.expected_solve_count
  end

  def trimmed_indices
    if missed_combined_round_cutoff?
      # When you miss the cutoff for a combined round, you don't
      # get an average, therefore none of the solves were trimmed.
      []
    else
      sorted_solves = sorted_solves_with_index
      trimmed_solves_with_index = sorted_solves[0...format.trim_fastest_n]
      trimmed_solves_with_index += sorted_solves[(sorted_solves.length - format.trim_slowest_n)...sorted_solves.length]
      trimmed_solves_with_index.map { |s, i| i }
    end
  end

  private def sorted_solves_with_index
    solves.each_with_index.reject { |s, i| s.skipped? }.sort
  end

  def solves
    solves = (1..5).map { |i| SolveTime.new(eventId, :single, send(:"value#{i}")) }
    solves
  end

  def to_s(field)
    SolveTime.new(eventId, field, send(field)).clock_format
  end
end
