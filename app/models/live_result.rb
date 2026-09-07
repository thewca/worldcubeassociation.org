# frozen_string_literal: true

class LiveResult < ApplicationRecord
  BEST_POSSIBLE_SCORE = 1
  WORST_POSSIBLE_SCORE = -1

  PODIUM_RANGE = 1..3

  has_many :live_attempts, dependent: :destroy
  alias_method :attempts, :live_attempts

  has_many :live_result_history_entries, dependent: :delete_all

  after_save :trigger_recompute, if: :should_recompute?

  belongs_to :registration

  belongs_to :round

  delegate :wcif_id, to: :round, prefix: true

  belongs_to :quit_by, class_name: 'User', optional: true
  belongs_to :locked_by, class_name: 'User', optional: true

  scope :not_empty, -> { where.not(best: 0) }

  scope :globally_ranked, -> { where.not(global_pos: nil) }
  scope :locally_ranked, -> { where.not(local_pos: nil) }

  scope :locked, -> { where.not(locked_by_id: nil) }
  scope :not_locked, -> { where(locked_by_id: nil) }

  scope :advancing, -> { where(advancing: true) }
  scope :not_advancing, -> { where(advancing: false) }

  scope :quit, -> { where.not(quit_by_id: nil) }
  scope :not_quit, -> { where(quit_by_id: nil) }

  alias_attribute :result_id, :id

  has_one :event, through: :round
  has_one :format, through: :round

  validates :best,
            presence: true,
            numericality: { only_integer: true }

  validates :average,
            presence: true,
            numericality: { only_integer: true }

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[global_pos local_pos registration_id best average single_record_tag average_record_tag advancing last_attempt_entered_at advancing_questionable entered_at entered_by_id],
    methods: %w[event_id attempts result_id forecast_statistics round_wcif_id],
    include: %w[],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  delegate :event_id, :format_id, :round_type_id, :competition_id, to: :round
  delegate :registrant_id, to: :registration

  def to_solve_time(field)
    SolveTime.new(event_id, field, send(field))
  end

  def ranking_columns
    [format.rank_by_column, format.secondary_rank_by_column].compact
  end

  def best_possible_solve_times
    ranking_columns.map do |column|
      SolveTime.new(event_id, column, BEST_POSSIBLE_SCORE)
    end
  end

  def mark_as_quit!(quit_by_user)
    quit_count = self.update!(quit_by_id: quit_by_user.id, advancing: false, advancing_questionable: false)
    self.live_result_history_entries.create!(entered_by_id: quit_by_user.id, action_type: :quit)
    quit_count
  end

  def quit?
    self.quit_by_id?
  end

  def locked?
    self.locked_by_id?
  end

  def self.compute_average_and_best(attempts, round)
    r = Result.new(
      event_id: round.event.id,
      round_type_id: round.round_type_id,
      round_id: round.id,
      format_id: round.format_id,
      result_attempts: attempts.map(&:to_result_attempt),
    )

    [r.compute_correct_average, r.compute_correct_best]
  end

  def potential_solve_time
    complete? ? values_for_sorting : best_possible_solve_times
  end

  def should_recompute?
    saved_change_to_best? || saved_change_to_average?
  end

  def complete?
    live_attempts_count == round.format.expected_solve_count || didnt_meet_cutoff?
  end

  def didnt_meet_cutoff?
    live_attempts.any? && round.cutoff.present? && round.cutoff.exceeds?(live_attempts)
  end

  def missing_attempts?
    !complete?
  end

  def values_for_sorting
    ranking_columns.map do |column|
      to_solve_time(column)
    end
  end

  def to_inbox_result
    attempt_values = live_attempts.pluck(:value)

    InboxResult.new(
      round: self.round,
      competition_id: self.competition_id,
      person_id: self.registrant_id,
      pos: self.local_pos,
      global_pos: self.global_pos,
      event_id: self.event_id,
      format_id: self.format_id,
      round_type_id: self.round_type_id,
      best: self.best,
      average: self.average,
      value1: attempt_values[0],
      value2: attempt_values[1] || 0,
      value3: attempt_values[2] || 0,
      value4: attempt_values[3] || 0,
      value5: attempt_values[4] || 0,
    )
  end

  def to_wcif(version: Competition::WCIF_STABLE_VERSION)
    {
      "personId" => registrant_id,
      "ranking" => global_pos,
      "attempts" => live_attempts.map { it.to_wcif(version: version) },
      "best" => best,
      "average" => average,
    }
  end

  def self.wcif_json_schema(version: Competition::WCIF_STABLE_VERSION)
    {
      "type" => %w[object null],
      "properties" => {
        "personId" => { "type" => "integer" },
        "ranking" => { "type" => %w[integer null] },
        "attempts" => { "type" => "array", "items" => LiveAttempt.wcif_json_schema(version: version) },
        "best" => { "type" => "integer" },
        "average" => { "type" => "integer" },
      },
    }
  end

  LIVE_STATE_SERIALIZE_OPTIONS = {
    only: %w[advancing advancing_questionable average average_record_tag best registration_id last_attempt_entered_at single_record_tag],
    methods: %w[],
    include: [{ live_attempts: { only: %i[value attempt_number] } }],
  }.freeze

  def to_live_state
    serializable_hash(LIVE_STATE_SERIALIZE_OPTIONS)
  end

  def self.compute_diff(before_result, after_result)
    changed_vals = after_result.slice(*LIVE_STATE_SERIALIZE_OPTIONS[:only])
                               .reject { |k, v| before_result[k] == v }
    diff = changed_vals.merge("registration_id" => after_result["registration_id"])

    # Include new attempts if they have changed, it's too much of a hassle to
    # replace single values in the frontend.
    diff["live_attempts"] = after_result["live_attempts"] if LiveAttempt.attempts_changed?(
      before_result["live_attempts"],
      after_result["live_attempts"],
    )

    # Only return if there are actual changes
    diff if diff.except("registration_id").present?
  end

  def forecast_statistics
    return nil if complete?

    LiveResult.compute_forecast_statistics(live_attempts.as_json, round)
  end

  # Self-contained per-result projections (safe to send in diffs). `live_attempts`
  # are the plain hashes ({ "value" => ..., "attempt_number" => ... }).
  def self.compute_forecast_statistics(live_attempts, round)
    values = live_attempts.pluck("value")

    {
      **self.compute_best_and_worst_possible_average(live_attempts, round),
      "projected_average" => compute_projected_average(values, round),
    }
  end

  def self.compute_best_and_worst_possible_average(live_attempts, round)
    {
      "best_possible_average" => compute_padded_average(live_attempts, round, BEST_POSSIBLE_SCORE),
      "worst_possible_average" => compute_padded_average(live_attempts, round, WORST_POSSIBLE_SCORE),
    }
  end

  def self.compute_padded_average(live_attempts, round, score)
    missing_count = round.format.expected_solve_count - live_attempts.length

    padded = live_attempts + Array.new(missing_count) do |i|
      { "attempt_number" => live_attempts.length + i + 1, "value" => score }
    end

    attempts = padded.map { LiveAttempt.new(it) }
    compute_average_and_best(attempts, round).first
  end

  # See the front-end wca-live `average` helper — this is the incomplete-result
  # projection (median / middle-two mean) rather than the official average.
  def self.compute_projected_average(values, round)
    expected = round.format.expected_solve_count

    return SolveTime::SKIPPED_VALUE if values.empty?

    if round.event_id == "333fm"
      return SolveTime::DNF_VALUE unless values.all?(&:positive?)

      # Move counts are stored as-is but averages are scaled by 100.
      return (values.sum * 100.0 / values.length).round
    end

    sorted = values.sort_by { SolveTime.new(round.event_id, :single, it) }

    case expected
    when 3
      mean_or_dnf(values)
    when 5
      case values.length
      when 1, 2 then mean_or_dnf(values)
      when 3 then sorted[1] # median
      when 4 then mean_or_dnf([sorted[1], sorted[2]]) # middle two
      else mean_or_dnf([sorted[1], sorted[2], sorted[3]])
      end
    else
      SolveTime::SKIPPED_VALUE
    end
  end

  # Like wca-live's meanOfX: any incomplete (DNF/DNS) attempt makes the mean DNF.
  # https://github.com/thewca/wca-live/blob/ad90b09f88667b94ddde1293301898171fe38e05/client/src/lib/attempt-result.js#L128-L131
  # Mirrors Resultable#compute_correct_average, which we can't call directly because
  # projections mean incomplete subsets (e.g. middle two of four) no Format expresses.
  def self.mean_or_dnf(values)
    return SolveTime::DNF_VALUE unless values.all?(&:positive?)

    raw_average = values.sum.to_f / values.length
    # Averages over 10 minutes are rounded to the nearest second, see
    # https://www.worldcubeassociation.org/regulations/#9f2
    raw_average > 60_000 ? raw_average.round(-2) : raw_average.round
  end

  def self.empty_result_attributes(registration_id, round_id)
    { registration_id: registration_id, round_id: round_id, average: 0, best: 0, last_attempt_entered_at: current_time_from_proper_timezone }
  end

  private

    def trigger_recompute
      return if format.id == "h"

      round.recompute_live_columns(skip_advancing: locked?)
    end
end
