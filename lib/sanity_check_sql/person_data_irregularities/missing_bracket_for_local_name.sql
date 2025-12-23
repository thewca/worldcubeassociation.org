SELECT * FROM persons WHERE (name LIKE '%(%' OR name LIKE '%)') AND name NOT LIKE '%(%)%'
