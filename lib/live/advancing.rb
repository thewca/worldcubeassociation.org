# frozen_string_literal: true

module Live
  module Advancing
    def self.recompute_advancing(advancement_source, can_update_advancing: true)
      results_with_potential = advancement_source.advancement_results.reject(&:locked?).sort_by(&:potential_solve_time)

      advancement_determining_condition = if advancement_source.final_round?
                                            Live::Advancing.podium_condition(advancement_source.ranking_format)
                                          else
                                            advancement_source.target_participation_condition
                                          end

      advancing_ids = advancement_determining_condition.apply(results_with_potential).pluck(:registration_id)
      max_advancing = advancement_determining_condition.max_qualifying(results_with_potential)

      results_to_update = advancement_source.live_results.globally_ranked.not_locked

      if can_update_advancing && advancing_ids.any?
        results_to_update.update_all(
          ["advancing = (registration_id IN (?)), advancing_questionable = (global_pos <= ?)", advancing_ids, max_advancing],
        )
      else
        results_to_update.update_all(
          ["advancing = FALSE, advancing_questionable = (global_pos <= ?)", max_advancing],
        )
      end
    end

    def self.recompute_global_pos_query(format, linked_round, person_key, table)
      rank_by = format.rank_by_column
      secondary_rank_by = format.secondary_rank_by_column
      round_ids = linked_round.round_ids.join(",")

      secondary_rank_sql = secondary_rank_by ? ", person_best.#{secondary_rank_by} <= 0, person_best.#{secondary_rank_by} ASC" : ""
      secondary_rank_inner_sql = secondary_rank_by ? ", t.#{secondary_rank_by} <= 0, t.#{secondary_rank_by} ASC" : ""

      # Similar to the query that recomputes local_pos, but
      # at first it computes the best result of a person over all linked rounds
      # by using the same ORDER BY <=0 trick
      <<~SQL.squish
      UPDATE #{table} r
      LEFT JOIN
        (SELECT #{person_key},
                RANK() OVER (ORDER BY person_best.#{rank_by} <= 0,
                             person_best.#{rank_by} ASC #{secondary_rank_sql}) AS ranking
         FROM
           (SELECT *
            FROM
              (SELECT t.*,
                      ROW_NUMBER() OVER (PARTITION BY t.#{person_key}
                                         ORDER BY (t.#{rank_by} <= 0) ASC,
                                         t.#{rank_by} ASC #{secondary_rank_inner_sql}) AS rownum
               FROM #{table} t
               WHERE t.round_id IN (#{round_ids})
                 AND t.best != 0) x
            WHERE rownum = 1) AS person_best) ranked ON r.#{person_key} = ranked.#{person_key}
      SET r.global_pos = ranked.ranking
      WHERE r.round_id IN (#{round_ids});
    SQL
    end

    def self.podium_condition(format)
      ResultConditions::Ranking.new(scope: format.sort_by, value: 3)
    end
  end
end
