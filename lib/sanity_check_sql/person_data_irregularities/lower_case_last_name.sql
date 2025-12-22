SELECT * FROM persons
WHERE (LEFT(SUBSTRING_INDEX(SUBSTRING_INDEX(name, '(', 1), ' ', -1), 1)) COLLATE utf8mb4_bin REGEXP '^[a-z]'
  -- Excludes last names in the format d'X and deX
  AND SUBSTRING_INDEX(SUBSTRING_INDEX(name, '(', 1), ' ', -1)
      NOT REGEXP "^d'[A-Z]"
  AND SUBSTRING_INDEX(SUBSTRING_INDEX(name, '(', 1), ' ', -1)
      NOT REGEXP "^de[A-Z]";
