WITH qualification_events AS (
  -- Old-style qualification rounds ('0' and 'h') allowed pre-qualified competitors to skip
  -- straight into the main rounds, so the backfilled participation sources are unreliable
  -- for the entire competition/event combination
  SELECT DISTINCT
    ce.competition_id,
    ce.event_id
  FROM rounds AS r
  INNER JOIN competition_events AS ce
  ON r.competition_event_id = ce.id
  WHERE r.old_type IN ('0', 'h')
),
dest_rounds AS (
  SELECT
    r.id AS round_id,
    r.number AS round_number,
    ce.competition_id,
    ce.event_id,
    r.participation_source_type,
    r.participation_source_id
  FROM rounds AS r
  INNER JOIN competition_events AS ce
  ON r.competition_event_id = ce.id
  INNER JOIN competitions AS c
  ON ce.competition_id = c.id
  LEFT JOIN qualification_events AS qe
  ON qe.competition_id = ce.competition_id
    AND qe.event_id = ce.event_id
  -- First rounds have a CompetitionEvent source and are governed by registration, not by results
  WHERE r.participation_source_type IN ('Round', 'LinkedRound')
    -- Until 2009, competitors could be admitted directly into subsequent rounds under special circumstances
    AND c.start_date >= '2009-01-01'
    -- Old qualification rounds and b-finals are not governed by participation conditions
    AND (r.old_type IS NULL OR r.old_type NOT IN ('0', 'h', 'b'))
    AND qe.competition_id IS NULL
),
source_round_mapping AS (
  SELECT
    dr.round_id AS dest_round_id,
    dr.participation_source_id AS source_round_id
  FROM dest_rounds AS dr
  WHERE dr.participation_source_type = 'Round'

  UNION ALL

  SELECT
    dr.round_id AS dest_round_id,
    sr.id AS source_round_id
  FROM dest_rounds AS dr
  INNER JOIN rounds AS sr
  ON dr.participation_source_id = sr.linked_round_id
  WHERE dr.participation_source_type = 'LinkedRound'
),
-- Best single per person across the source round(s); for LinkedRound sources this
-- naturally merges the dual rounds
person_source_best AS (
  SELECT
    srm.dest_round_id,
    res.person_id,
    MAX(res.best) AS max_best
  FROM source_round_mapping AS srm
  INNER JOIN results AS res
  ON res.round_id = srm.source_round_id
  GROUP BY srm.dest_round_id, res.person_id
)
SELECT
  dr.competition_id,
  dr.event_id,
  res.round_type_id,
  dr.round_id,
  dr.round_number,
  res.person_id,
  res.person_name,
  psb.max_best AS best_in_source_round
FROM dest_rounds AS dr
INNER JOIN results AS res
ON res.round_id = dr.round_id
LEFT JOIN person_source_best AS psb
ON psb.dest_round_id = dr.round_id
  AND psb.person_id = res.person_id
-- Flag competitors with no result in the source round at all, or without any successful attempt there
WHERE psb.person_id IS NULL
  OR psb.max_best <= 0
ORDER BY RIGHT(dr.competition_id, 4), dr.competition_id, dr.event_id, dr.round_number, res.person_id;
