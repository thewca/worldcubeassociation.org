WITH schedule_activities_normalized AS (
  SELECT
    c.id AS competition_id,
    sa.name AS activity_name,
    sa.activity_code,
    c.start_date,
    c.end_date,
    CONVERT_TZ(sa.start_time, 'UTC', cv.timezone_id) AS local_start_datetime,
    CONVERT_TZ(sa.end_time, 'UTC', cv.timezone_id) AS local_end_datetime
  FROM competitions AS c
  INNER JOIN competition_venues AS cv
  ON cv.competition_id = c.id
  INNER JOIN venue_rooms AS vr
  ON vr.competition_venue_id = cv.id
  INNER JOIN schedule_activities AS sa
  ON sa.venue_room_id = vr.id
  WHERE c.results_posted_at IS NOT NULL
    AND sa.parent_activity_id IS NULL
)
SELECT
  competition_id,
  activity_name,
  activity_code,
  start_date,
  end_date,
  local_start_datetime,
  local_end_datetime
FROM schedule_activities_normalized
WHERE DATE(local_start_datetime) < start_date
  OR DATE(local_start_datetime) > end_date
  OR local_end_datetime > TIMESTAMP(DATE_ADD(end_date, INTERVAL 1 DAY))
ORDER BY RIGHT(competition_id, 4), competition_id, local_start_datetime;