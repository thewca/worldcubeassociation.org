SELECT p.wca_id, p.name as profile_name, u.name as account_name
FROM persons p
       INNER JOIN users u ON p.wca_id = u.wca_id AND p.name <> u.name AND p.sub_id = 1
