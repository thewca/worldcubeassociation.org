-- Compute linkings - relations auxiliary data.

DROP TABLE IF EXISTS wca_id_with_competition;
CREATE TABLE wca_id_with_competition AS (
  SELECT DISTINCT person_id wca_id, competition_id
  FROM results
);

CREATE INDEX index_wca_id_with_competition_on_competition_id_and_wca_id ON wca_id_with_competition (competition_id, wca_id);

SET SESSION group_concat_max_len = 1000000;

DELETE FROM linkings;

INSERT INTO linkings (wca_id, wca_ids)
SELECT first.wca_id wca_id, GROUP_CONCAT(DISTINCT second.wca_id) wca_ids
FROM wca_id_with_competition first
JOIN wca_id_with_competition second ON first.competition_id = second.competition_id AND first.wca_id != second.wca_id
GROUP BY first.wca_id;

DROP TABLE wca_id_with_competition;
