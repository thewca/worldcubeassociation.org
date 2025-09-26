# frozen_string_literal: true

namespace :results do
  desc "Fill result timestamps table"
  task fill_timestamps: [:environment] do
    ActiveRecord::Base.connection.execute(<<~SQL.squish)
      INSERT INTO result_timestamps (result_id, event_id, country_id, continent_id, best, average, round_timestamp, created_at, updated_at)
      WITH max_times_per_round AS (
          SELECT round_id, MAX(end_time) AS max_end_time
          FROM schedule_activities
          GROUP BY round_id
      )
      SELECT
          r.id,
          r.event_id,
          r.country_id,
          co.continent_id,
          r.best,
          r.average,
          COALESCE(m.max_end_time, c.end_date) AS round_timestamp,
          NOW(),
          NOW()
      FROM results r
               LEFT JOIN max_times_per_round m ON m.round_id = r.round_id
               LEFT JOIN competitions c ON c.id = r.competition_id
               LEFT JOIN countries co ON co.id = r.country_id
      ON DUPLICATE KEY UPDATE
              round_timestamp = VALUES(round_timestamp),
              updated_at = VALUES(updated_at);
    SQL
  end
end
