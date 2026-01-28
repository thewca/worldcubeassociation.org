# frozen_string_literal: true

class LiveResult < ApplicationRecord
  BEST_POSSIBLE_SCORE = 1

  has_many :live_attempts
  alias_method :attempts, :live_attempts

  after_save :trigger_recompute_columns, if: :should_recompute?

  after_save :notify_users

  belongs_to :registration

  belongs_to :round

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

  def to_inbox_result
    attempt_values = result.attempts.map(&:value)
    InboxResult.new({
                      competition: competition,
                      person_id: result.person_id,
                      pos: result.ranking,
                      event_id: round.event_id,
                      round_type_id: round.round_type_id,
                      round_id: round.id,
                      format_id: round.format_id,
                      best: result.best,
                      average: result.average,
                      value1: attempt_values[0],
                      value2: attempt_values[1] || 0,
                      value3: attempt_values[2] || 0,
                      value4: attempt_values[3] || 0,
                      value5: attempt_values[4] || 0,
                    })
  end

  def to_wcif
    {
      "personId" => self.registration.registrant_id,
      "ranking" => self.global_pos,
      "attempts" => self.attempts.map(&:to_wcif),
      "best" => self.best,
      "average" => self.average,
    }
  end

  def self.wcif_json_schema
    {
      "type" => %w[object null],
      "properties" => {
        "personId" => { "type" => "integer" },
        "ranking" => { "type" => %w[integer null] },
        "attempts" => { "type" => "array", "items" => LiveAttempt.wcif_json_schema },
        "best" => { "type" => "integer" },
        "average" => { "type" => "integer" },
      },
    }
  end

  private

    def notify_users
      ActionCable.server.broadcast(WcaLive.broadcast_key(round_id), as_json)
    end

    def trigger_recompute_columns
      round.recompute_live_columns
    end
end
