SELECT
  p.wca_id,
  p.name AS profile_name,
  u.name AS account_name
FROM persons AS p
INNER JOIN users AS u
ON p.wca_id = u.wca_id
  AND p.name <> u.name
  AND p.sub_id = 1;
