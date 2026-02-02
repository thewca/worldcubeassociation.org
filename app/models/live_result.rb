# frozen_string_literal: true

class LiveResult < ApplicationRecord
  BEST_POSSIBLE_SCORE = 1

  has_many :live_attempts
  alias_method :attempts, :live_attempts

  after_save :trigger_recompute_and_notify, if: :should_recompute?

  belongs_to :registration

  belongs_to :round

  scope :not_empty, -> { where.not(best: 0) }

  alias_attribute :result_id, :id

  has_one :event, through: :round
  has_one :format, through: :round

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[global_pos local_pos registration_id round_id best average single_record_tag average_record_tag advancing advancing_questionable entered_at entered_by_id],
    methods: %w[event_id attempts result_id],
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

  def self.column_names_for_live_state
    self.column_names - %w[id last_attempt_entered_at created_at updated_at quit_by_id locked_by_id round_id]
  end

  def to_live_state
    serializable_hash({ only: LiveResult.column_names_for_live_state, methods: [], include: [live_attempts: { only: %i[id value attempt_number] }] })
  end

  def self.compute_diff(before_result, after_result)
    diff = { "registration_id" => after_result["registration_id"] }

    column_names_for_live_state.map.each do |field|
      diff[field] = after_result[field] if before_result[field] != after_result[field]
    end

    # Include new attempts if they have changed, it's too much of a hassle to
    # replace single values in the frontend.
    diff["live_attempts"] = after_result["live_attempts"] if LiveAttempt.attempt_changed?(
      before_result["live_attempts"],
      after_result["live_attempts"],
    )

    # Only return if there are actual changes
    diff.keys.size > 1 ? diff : nil
  end

  private

    def trigger_recompute_and_notify
      before_state = round.live_state

      round.recompute_live_columns
      # We need to reload because live results are changed directly on SQL level for more optimized queries
      round.live_results.reload

      after_state = round.live_state
      diff = Live::Helper.round_state_diff(before_state, after_state)
      ActionCable.server.broadcast(WcaLive.broadcast_key(round_id), diff)
    end
end
