# frozen_string_literal: true

namespace :results do
  desc "Fill result timestamps table"
  task fill_timestamps: [:environment] do
    # First, just set the timestamp to the competition end_date in case
    # there is no round data

    ActiveRecord::Base.connection.execute(<<~SQL)
      INSERT INTO result_timestamps (result_id, round_timestamp, created_at, updated_at)
      SELECT results.id, competitions.end_date, NOW(), NOW()
      FROM results
      INNER JOIN competitions ON competitions.id = results.competition_id
      ON DUPLICATE KEY UPDATE
        round_timestamp = VALUES(round_timestamp),
        updated_at = VALUES(updated_at)
    SQL

    # Now, set the timestamps for each round
    # TODO: This only works once results are linked to a round
    ActiveRecord::Base.connection.execute(<<~SQL)
      INSERT INTO result_timestamps (result_id, round_timestamp, created_at, updated_at)
      SELECT
        results.id,
        (
          SELECT MAX(schedule_activities.end_time)
          FROM schedule_activities
          WHERE schedule_activities.round_id = results.round_id
        ) AS round_timestamp,
        NOW(),
        NOW()
      FROM results WHERE round_id IS NOT NULL
      ON DUPLICATE KEY UPDATE
        round_timestamp = VALUES(round_timestamp),
        updated_at = VALUES(updated_at)
    SQL
  end
end
