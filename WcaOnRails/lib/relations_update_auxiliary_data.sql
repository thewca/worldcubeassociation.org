-- Update relations auxiliary data.

DROP TABLE IF EXISTS new_wca_id_with_competition;
CREATE TABLE new_wca_id_with_competition AS (
  SELECT DISTINCT personId wca_id, competitionId competition_id
  FROM Results result
  WHERE NOT EXISTS (
    SELECT 1
    FROM people_pairs_with_competition people_pair
    WHERE people_pair.competition_id = result.competitionId
  )
);

CREATE INDEX index_new_wca_id_with_competition_on_wca_id ON new_wca_id_with_competition (wca_id);
CREATE INDEX index_new_wca_id_with_competition_on_competition_id_and_wca_id ON new_wca_id_with_competition (competition_id, wca_id);

INSERT INTO people_pairs_with_competition (wca_id1, wca_id2, competition_id)
SELECT
  first.wca_id wca_id1,
  second.wca_id wca_id2,
  first.competition_id
FROM new_wca_id_with_competition first
JOIN new_wca_id_with_competition second ON first.competition_id = second.competition_id AND first.wca_id != second.wca_id;

DELETE FROM linkings
WHERE EXISTS (
  SELECT 1
  FROM new_wca_id_with_competition
  WHERE new_wca_id_with_competition.wca_id = linkings.wca_id
);

SET SESSION group_concat_max_len = 1000000;

INSERT INTO linkings (wca_id, wca_ids)
SELECT
  wca_id1 wca_id,
  GROUP_CONCAT(DISTINCT wca_id2) wca_ids
FROM people_pairs_with_competition
WHERE EXISTS (
  SELECT 1
  FROM new_wca_id_with_competition
  WHERE new_wca_id_with_competition.wca_id = people_pairs_with_competition.wca_id1
)
GROUP BY wca_id1;

DROP TABLE new_wca_id_with_competition;
