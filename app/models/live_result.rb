# frozen_string_literal: true

class LiveResult < ApplicationRecord
  has_many :live_attempts, -> { where(replaced_by: nil).order(:attempt_number) }

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

  def attempts
    live_attempts.order(:attempt_number)
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
    ActiveRecord::Base.connection.exec_query <<-SQL
      UPDATE live_results r
      LEFT JOIN (
          SELECT id,
                 RANK() OVER (
                     ORDER BY
                       CASE
                         WHEN #{rank_by} > 0 THEN #{rank_by}
                         ELSE 1e9
                       END ASC
                       #{", CASE WHEN #{secondary_rank_by} > 0 THEN #{secondary_rank_by} ELSE 1e9 END ASC" if secondary_rank_by}
                 ) AS `rank`
          FROM live_results
          WHERE round_id = #{round.id} AND best > 0
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
