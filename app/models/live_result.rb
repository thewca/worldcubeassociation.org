# frozen_string_literal: true

class LiveResult < ApplicationRecord
  BEST_POSSIBLE_SCORE = 1

  has_many :live_attempts
  alias_method :attempts, :live_attempts

  after_create :recompute_local_pos
  after_create :recompute_global_pos

  after_update :recompute_local_pos, if: :should_recompute?
  after_update :recompute_global_pos, if: :should_recompute?

  # This hook has to be executed _after_ computing the rankings
  after_save :recompute_advancing, if: :should_recompute?

  after_save :notify_users

  belongs_to :registration

  belongs_to :round

  alias_attribute :result_id, :id

  has_one :event, through: :round
  has_one :format, through: :round

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[ranking registration_id round_id best average single_record_tag average_record_tag advancing advancing_questionable entered_at entered_by_id],
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

  def potential_solve_time
    complete? ? values_for_sorting : best_possible_solve_times
  end

  def should_recompute?
    saved_change_to_best? || saved_change_to_average?
  end

  def recompute_local_pos
    rank_by = format.rank_by_column
    # We only want to decide ties by single in events decided by average
    secondary_rank_by = format.secondary_rank_by_column
    # The following query uses an `ORDER BY best <= 0, best ASC` trick. The idea is:
    #   1. The first part of the `ORDER BY` evaluates to a boolean. Booleans are just
    #     `TINYINT` in MySQL with TRUE=1 and FALSE=0, so that FALSE < TRUE.
    #     This means that valid attempts where `best <= 0` is FALSE come first, and
    #     invalid attempts where `best <= 0` is TRUE come last.
    #   2. The attempts are then sorted among themselves using their normal numeric value.
    #     This works in particular because sorting in MySQL is stable, i.e. the sorting
    #     based on the second part won't destroy the order established by the first part.
    ActiveRecord::Base.connection.exec_query <<-SQL.squish
      UPDATE live_results r
      LEFT JOIN (
          SELECT id,
                 RANK() OVER (
                     ORDER BY #{rank_by} <= 0, #{rank_by} ASC
                       #{", #{secondary_rank_by} <= 0, #{secondary_rank_by} ASC" if secondary_rank_by}
                 ) AS `rank`
          FROM live_results
          WHERE round_id = #{round.id} AND best != 0
      ) ranked
      ON r.id = ranked.id
      SET r.local_pos = ranked.rank
      WHERE r.round_id = #{round.id};
    SQL
  end

  def complete?
    live_attempts.where.not(result: 0).count == round.format.expected_solve_count
  end

  def values_for_sorting
    ranking_columns.map do |column|
      to_solve_time(column)
    end
  end

  private

    def notify_users
      ActionCable.server.broadcast(WcaLive.broadcast_key(round_id), as_json)
    end

    def recompute_advancing
      has_linked_round = round.linked_round.present?
      advancement_determining_results = has_linked_round ? round.linked_round.live_results : round.live_results

      # Only ranked results can be considered for advancing.
      round_results = advancement_determining_results.where.not(global_pos: nil)
      round_results.update_all(advancing: false, advancing_questionable: false)

      missing_attempts = round.total_accepted_registrations - round_results.count
      potential_results = Array.new(missing_attempts) { LiveResult.build(round: round) }
      results_with_potential = (round_results.to_a + potential_results).sort_by(&:potential_solve_time)

      qualifying_index = if round.final_round?
                           3
                         else
                           # Our Regulations allow at most 75% of competitors to proceed
                           max_qualifying = (round_results.count * 0.75).floor
                           [round.advancement_condition.max_advancing(round_results), max_qualifying].min
                         end

      round_results.update_all("advancing_questionable = global_pos BETWEEN 1 AND #{qualifying_index}")

      # Determine which results would advance if everyone achieved their best possible attempt.
      advancing_ids = results_with_potential.take(qualifying_index).select(&:complete?).pluck(:id)

      LiveResult.where(id: advancing_ids).update_all(advancing: true)
    end

    def recompute_global_pos
      # For non-linked rounds, just set the global_pos to local_pos
      return round.live_results.update_all("global_pos = local_pos") if round.linked_round.blank?

      rank_by = format.rank_by_column
      secondary_rank_by = format.secondary_rank_by_column
      round_ids = round.linked_round.round_ids.join(",")

      # Similar to the query that recomputes local_pos, but
      # at first it computes the best result of a person over all linked rounds
      # by using the same ORDER BY <=0 trick
      query = <<-SQL.squish
      UPDATE live_results r
      LEFT JOIN (
          SELECT id,
                 RANK() OVER (
                   ORDER BY person_best.#{rank_by} <= 0, person_best.#{rank_by} ASC
                   #{", person_best.#{secondary_rank_by} <= 0, person_best.#{secondary_rank_by} ASC" if secondary_rank_by}
                 ) AS ranking
          FROM (
        SELECT *
        FROM (
            SELECT
              lr.*,
              ROW_NUMBER() OVER (
                PARTITION BY lr.registration_id
                ORDER BY
                  (lr.#{rank_by} <= 0) ASC,
                  lr.#{rank_by} ASC
                  #{", lr.#{secondary_rank_by} <= 0, lr.#{secondary_rank_by} ASC" if secondary_rank_by}
              ) AS rownum
            FROM live_results lr
            WHERE lr.round_id IN (#{round_ids})
              AND lr.best != 0
        ) x
        WHERE rownum = 1
    ) AS person_best
      ) ranked
      ON r.id = ranked.id
      SET r.global_pos = ranked.ranking
      WHERE r.round_id IN (#{round_ids});
      SQL

      ActiveRecord::Base.connection.exec_query query
    end
end
