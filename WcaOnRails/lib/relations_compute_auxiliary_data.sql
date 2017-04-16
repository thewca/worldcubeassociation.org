-- Compute relations auxiliary data.

CREATE TABLE IF NOT EXISTS wca_id_with_competition_TMP AS (
  SELECT DISTINCT personId wca_id, competitionId competition_id
  FROM Results
);

DROP TABLE IF EXISTS wca_id_with_competition;
RENAME TABLE wca_id_with_competition_TMP TO wca_id_with_competition;

CREATE INDEX wca_id_with_competition_wca_id_index ON wca_id_with_competition (wca_id);
CREATE INDEX wca_id_with_competition_competition_id_index ON wca_id_with_competition (competition_id);

CREATE TABLE IF NOT EXISTS people_pairs_with_competition_TMP AS (
  SELECT
    first.wca_id wca_id1,
    second.wca_id wca_id2,
    first.competition_id
  FROM wca_id_with_competition first
  JOIN wca_id_with_competition second ON first.competition_id = second.competition_id AND first.wca_id != second.wca_id
);

DROP TABLE IF EXISTS people_pairs_with_competition;
RENAME TABLE people_pairs_with_competition_TMP TO people_pairs_with_competition;

CREATE INDEX people_pairs_with_competition_wca_ids_index ON people_pairs_with_competition (wca_id1, wca_id2);

SET SESSION group_concat_max_len = 1000000;

CREATE TABLE IF NOT EXISTS linkings_TMP AS (
  SELECT
    wca_id1 wca_id,
    GROUP_CONCAT(DISTINCT wca_id2) wca_ids
  FROM people_pairs_with_competition
  GROUP BY wca_id1
);

DROP TABLE IF EXISTS linkings;
RENAME TABLE linkings_TMP TO linkings;
