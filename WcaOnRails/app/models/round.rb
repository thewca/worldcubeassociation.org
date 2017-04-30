# frozen_string_literal: true

class Round < ApplicationRecord
  belongs_to :competition_event
  has_one :competition, through: :competition_event
  has_one :event, through: :competition_event
  belongs_to :format

  serialize :time_limit, TimeLimit
  serialize :cutoff, Cutoff
  serialize :advance_to_next_round_requirement, AdvanceToNextRoundRequirement

  MAX_NUMBER = 4
  validates_numericality_of :number,
                            only_integer: true,
                            greater_than_or_equal_to: 1,
                            less_than_or_equal_to: MAX_NUMBER

  validate do
    unless event.preferred_formats.find_by_format_id(format_id)
      errors.add(:format, "'#{format_id}' is not allowed for '#{event.id}'")
    end
  end

  validate do
    if final_round? && advance_to_next_round_requirement
      errors.add(:advance_to_next_round_requirement, "cannot be set on a final round")
    end
  end

  def final_round?
    competition_event.rounds.last == self
  end

  def multibld_attempt_to_points(attempt_value)
    solve_time = SolveTime.new("333mbf", :best, attempt_value)
    solve_time.points
  end

  def cutoff_to_s
    return "" if !cutoff

    if event.timed_event?
      centiseconds = cutoff.attemptValue
      I18n.t("cutoff.time", count: cutoff.numberOfAttempts, time: SolveTime.centiseconds_to_clock_format(centiseconds))
    elsif event.fewest_moves?
      moves = cutoff.attemptValue
      I18n.t("cutoff.moves", count: cutoff.numberOfAttempts, moves: moves)
    elsif event.multiple_blindfolded?
      points = multibld_attempt_to_points(cutoff.attemptValue)
      I18n.t("cutoff.points", count: cutoff.numberOfAttempts, points: points)
    else
      raise "Unrecognized event: #{event.id}"
    end
  end

  def name
    I18n.t("round.name", event: event.name, number: self.number)
  end

  private def wcif_round_id_to_round(wcif_round_id)
    event_id, round_number = wcif_round_id.split("-")
    competition_event = competition.competition_events.find_by_event_id!(event_id)
    competition_event.rounds.find_by_number!(round_number)
  end

  def time_limit_to_s
    time_str = SolveTime.new(competition_event.event_id, :best, time_limit.centiseconds).clock_format
    case self.time_limit.cumulative_round_ids.length
    when 0
      time_str
    when 1
      I18n.t("time_limit.cumulative.one_round", time: time_str)
    else
      rounds = self.time_limit.cumulative_round_ids.map { |round_id| wcif_round_id_to_round(round_id) }
      rounds_str = rounds.map(&:name).to_sentence
      I18n.t("time_limit.cumulative.across_rounds", time: time_str, rounds: rounds_str)
    end
  end

  def advance_to_next_round_requirement_to_s
    return "" if !advance_to_next_round_requirement

    next_round_number = self.number + 1
    case advance_to_next_round_requirement.type
    when "ranking"
      ranking = advance_to_next_round_requirement.ranking
      I18n.t("advance_to_next_round_requirement.ranking", ranking: ranking, next_round_number: next_round_number)
    when "attemptValue"
      if event.timed_event?
        centiseconds = advance_to_next_round_requirement.attemptValue
        I18n.t("advance_to_next_round_requirement.attemptValue.time", time: SolveTime.centiseconds_to_clock_format(centiseconds), next_round_number: next_round_number)
      elsif event.fewest_moves?
        moves = advance_to_next_round_requirement.attemptValue
        I18n.t("advance_to_next_round_requirement.attemptValue.moves", moves: moves, next_round_number: next_round_number)
      elsif event.multiple_blindfolded?
        points = multibld_attempt_to_points(advance_to_next_round_requirement.attemptValue)
        I18n.t("advance_to_next_round_requirement.attemptValue.points", points: points, next_round_number: next_round_number)
      else
        raise "Unrecognized event: #{event.id}"
      end
    else
      raise "Unknown type #{advance_to_next_round_requirement.type}"
    end
  end

  def to_wcif
    {
      "id" => "#{event.id}-#{self.number}",
      "format" => self.format_id,
      "timeLimit" => time_limit&.to_wcif,
      "cutoff" => cutoff&.to_wcif,
      "advanceToNextRoundRequirement" => advance_to_next_round_requirement&.to_wcif,
    }
  end
end
