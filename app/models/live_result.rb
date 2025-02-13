# frozen_string_literal: true

class LiveResult < ApplicationRecord
  has_many :live_attempts
  alias_method :attempts, :live_attempts

  after_create :recompute_ranks
  after_update :recompute_ranks, if: :should_recompute?

  after_save :notify_users

  belongs_to :registration

  belongs_to :round

  alias_attribute :result_id, :id

  has_one :event, through: :round

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[ranking registration_id round_id best average single_record_tag average_record_tag advancing advancing_questionable entered_at entered_by_id],
    methods: %w[event_id attempts result_id],
    include: %w[],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  def event_id
    event.id
  end

  def potential_score
    rank_by = round.format.sort_by == 'single' ? 'best' : 'average'
    complete? ? self[rank_by.to_sym] : best_possible_score
  end

  def should_recompute?
    saved_change_to_best? || saved_change_to_average?
  end

  def recompute_ranks
    rank_by = round.format.sort_by == 'single' ? 'best' : 'average'
    # We only want to decide ties by single in events decided by average
    secondary_rank_by = round.format.sort_by == 'average' ? 'best' : nil
    # The following query uses an `ORDER BY best <= 0, best ASC` trick. The idea is:
    #   1. The first part of the `ORDER BY` evaluates to a boolean. Booleans are just
    #     `TINYINT` in MySQL with TRUE=1 and FALSE=0, so that FALSE < TRUE.
    #     This means that valid attempts where `best <= 0` is FALSE come first, and
    #     invalid attempts where `best <= 0` is TRUE come last.
    #   2. The attempts are then sorted among themselves using their normal numeric value.
    #     This works in particular because sorting in MySQL is stable, i.e. the sorting
    #     based on the second part won't destroy the order established by the first part.
    ActiveRecord::Base.connection.exec_query <<-SQL
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
      SET r.ranking = ranked.rank
      WHERE r.round_id = #{round.id};
    SQL
  end

  def complete?
    live_attempts.where.not(result: 0).count == round.format.expected_solve_count
  end

  private

    def notify_users
      ActionCable.server.broadcast("results_#{round_id}", serializable_hash)
    end
end
