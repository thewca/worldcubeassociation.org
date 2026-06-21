WITH schedule_activities_normalized AS (
    SELECT
        c.id AS competition_id,
        c.start_date,
        c.end_date,
        DATE(CONVERT_TZ(sa.start_time, 'UTC', cv.timezone_id)) AS local_start_date,
        CONVERT_TZ(sa.end_time, 'UTC', cv.timezone_id) AS local_end_time
    FROM competitions c
    JOIN competition_venues cv ON cv.competition_id = c.id
    JOIN venue_rooms vr ON vr.competition_venue_id = cv.id
    JOIN schedule_activities sa ON sa.venue_room_id = vr.id
    WHERE c.results_posted_at IS NOT NULL
)
SELECT
    competition_id,
    start_date,
    end_date,
    COUNT(*) AS violating_activities
FROM schedule_activities_normalized
WHERE local_start_date < start_date
   OR local_start_date > end_date
   OR local_end_time > TIMESTAMP(DATE_ADD(end_date, INTERVAL 1 DAY))
GROUP BY competition_id, start_date, end_date
ORDER BY violating_activities DESC, competition_id;
