class LightResult
  attr_accessor :muted

  attr_reader :value1,
    :value2,
    :value3,
    :value4,
    :value5,
    :best,
    :average,
    :personName,
    :eventId,
    :formatId,
    :roundId,
    :pos,
    :personId,
    :regionalSingleRecord,
    :regionalAverageRecord,
    :countryId

  def initialize(r)
    @value1 = r["value1"]
    @value2 = r["value2"]
    @value3 = r["value3"]
    @value4 = r["value4"]
    @value5 = r["value5"]
    @best = r["best"]
    @average = r["average"]
    @personName = r["personName"]
    @eventId = r["eventId"]
    @formatId = r["formatId"]
    @roundId = r["roundId"]
    @pos = r["pos"]
    @personId = r["personId"]
    @regionalSingleRecord = r["regionalSingleRecord"]
    @regionalAverageRecord = r["regionalAverageRecord"]
    @countryId = r["countryId"]
  end

  def results_path
    "/results/p.php?i=#{personId}"
  end

  def event
    Event.find(eventId)
  end

  def round
    Round.find(roundId)
  end

  def format
    Format.find_by_id(formatId)
  end

  def muted
    false
  end

  def wca_id
    @personId
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

  private def sorted_solves_with_index
  @sorted_solves_with_index ||= solves.each_with_index.reject { |s, i| s.skipped? }.sort
end

def solves
  @solves ||= [SolveTime.new(eventId, :single, value1),
               SolveTime.new(eventId, :single, value2),
               SolveTime.new(eventId, :single, value3),
               SolveTime.new(eventId, :single, value4),
               SolveTime.new(eventId, :single, value5)]
end

def worst_index
  sorted_solves_with_index.max[1]
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
  end
