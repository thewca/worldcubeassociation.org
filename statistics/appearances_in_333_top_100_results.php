<?

$single = dbQuery("
  SELECT concat(personId,'-',personName), count(*) appearances FROM (SELECT * FROM
  (
  SELECT personId, personName, eventId, value1 value FROM Results UNION ALL
  SELECT personId, personName, eventId, value2 value FROM Results UNION ALL
  SELECT personId, personName, eventId, value3 value FROM Results UNION ALL
  SELECT personId, personName, eventId, value4 value FROM Results UNION ALL
  SELECT personId, personName, eventId, value5 value FROM Results
  ) singleValue
  $WHERE value>0 AND eventId = '333'
  ORDER BY value
  LIMIT 100
  ) top100
  GROUP BY personId
  ORDER BY appearances DESC, personName
");

$average = dbQuery("
  SELECT concat(personId,'-',personName), count(*) appearances
  FROM (SELECT * FROM Results $WHERE eventId='333' AND average>0 ORDER BY average LIMIT 100) top100
  GROUP BY personId
  ORDER BY appearances DESC, personName
  LIMIT 10
");

$lists[] = array(
  "Appearances in 3x3x3 top 100 results",
  "Single | Average",
  "[P] Person [N] Appearances [T] | [P] Person [N] Appearances",
  my_merge( $single, $average )
);

?>
