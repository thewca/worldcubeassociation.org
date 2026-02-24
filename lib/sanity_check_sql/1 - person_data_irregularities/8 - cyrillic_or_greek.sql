SELECT *
FROM persons
WHERE name REGEXP '[А-ЯІΑ-Ω].*[(]'
   OR (name REGEXP '[А-ЯІΑ-Ω]' AND name NOT REGEXP '[(]')
