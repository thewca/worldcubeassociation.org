-- Compute relations auxiliary data.

DROP TABLE IF EXISTS wca_id_with_competition;
CREATE TABLE wca_id_with_competition AS (
  SELECT DISTINCT personId wca_id, competitionId competition_id
  FROM Results
);

CREATE INDEX index_wca_id_with_competition_on_competition_id_andwca_id ON wca_id_with_competition (competition_id, wca_id);

DROP TABLE IF EXISTS people_pairs_with_competition;
CREATE TABLE people_pairs_with_competition AS (
  SELECT
    first.wca_id wca_id1,
    second.wca_id wca_id2,
    first.competition_id
  FROM wca_id_with_competition first
  JOIN wca_id_with_competition second ON first.competition_id = second.competition_id AND first.wca_id != second.wca_id
);

CREATE INDEX index_people_pairs_with_competition_on_wca_ids ON people_pairs_with_competition (wca_id1, wca_id2);
CREATE INDEX index_people_pairs_with_competition_on_competition_id ON people_pairs_with_competition (competition_id);

SET SESSION group_concat_max_len = 1000000;

DROP TABLE IF EXISTS linkings;
CREATE TABLE IF NOT EXISTS linkings AS (
  SELECT
    wca_id1 wca_id,
    GROUP_CONCAT(DISTINCT wca_id2) wca_ids
  FROM people_pairs_with_competition
  GROUP BY wca_id1
);

CREATE INDEX index_linkings_on_wca_id ON linkings (wca_id);

DROP TABLE wca_id_with_competition;
