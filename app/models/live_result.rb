# frozen_string_literal: true

class LiveResult < ApplicationRecord
  BEST_POSSIBLE_SCORE = 1
  WORST_POSSIBLE_SCORE = -1

  has_many :live_attempts, dependent: :destroy
  alias_method :attempts, :live_attempts

  after_save :trigger_recompute, if: :should_recompute?

  belongs_to :registration

  belongs_to :round

  belongs_to :quit_by, class_name: 'User', optional: true
  belongs_to :locked_by, class_name: 'User', optional: true

  scope :not_empty, -> { where.not(best: 0) }
  scope :locked, -> { where.not(locked_by: nil) }

  alias_attribute :result_id, :id

  has_one :event, through: :round
  has_one :format, through: :round

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[global_pos local_pos registration_id round_id best average single_record_tag average_record_tag advancing advancing_questionable entered_at entered_by_id],
    methods: %w[event_id attempts result_id best_and_worst_possible_average],
    include: %w[],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  delegate :id, to: :event, prefix: true

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
    update!(quit_by_id: quit_by_user.id, advancing: false, advancing_questionable: false)
  end

  def locked?
    locked_by_id.present?
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
    live_attempts.where.not(value: 0).count == round.format.expected_solve_count
  end

  def values_for_sorting
    ranking_columns.map do |column|
      to_solve_time(column)
    end
  end

  LIVE_STATE_SERIALIZE_OPTIONS = {
    only: %w[advancing advancing_questionable average average_record_tag best global_pos local_pos registration_id single_record_tag],
    methods: %w[],
    include: [{ live_attempts: { only: %i[id value attempt_number] } }],
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

  def best_and_worst_possible_average
    # use .length on purpose here as otherwise we would use one query per row
    LiveResult.compute_best_and_worse_possible_average(live_attempts.as_json, round) if live_attempts.length < round.format.expected_solve_count
  end

  def self.compute_best_and_worse_possible_average(live_attempts, round)
    missing_count = round.format.expected_solve_count - live_attempts.length

    {
      "best_possible_average" => BEST_POSSIBLE_SCORE,
      "worst_possible_average" => WORST_POSSIBLE_SCORE,
    }.transform_values do |score|
      padded = live_attempts + Array.new(missing_count) do |i|
        {
          "attempt_number" => live_attempts.length + i + 1,
          "value" => score,
        }
      end

      attempts = padded.map { |l| LiveAttempt.new(l) }
      avg, = LiveResult.compute_average_and_best(attempts, round)
      avg
    end
  end

  private

    def trigger_recompute
      return if format.id == "h"

      round.recompute_live_columns(skip_advancing: locked?)
    end
end
