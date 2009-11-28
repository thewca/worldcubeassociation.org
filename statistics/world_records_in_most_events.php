<?

$persons = dbQuery("
  SELECT personId, count(distinct eventId) worldRecordEvents
  FROM Results
  $WHERE regionalSingleRecord='WR' or regionalAverageRecord='WR'
  GROUP BY personId
  ORDER BY worldRecordEvents DESC, personName
  LIMIT 10
");

$countries = dbQuery("
  SELECT countryId, count(distinct eventId) worldRecordEvents
  FROM Results
  $WHERE regionalSingleRecord='WR' or regionalAverageRecord='WR'
  GROUP BY countryId
  ORDER BY worldRecordEvents DESC, countryId
  LIMIT 10
");

$competitions = dbQuery("
  SELECT competitionId, count(distinct eventId) worldRecordEvents
  FROM Results
  $WHERE regionalSingleRecord='WR' or regionalAverageRecord='WR'
  GROUP BY competitionId
  ORDER BY worldRecordEvents DESC, competitionId
  LIMIT 10
");

$lists[] = array(
  "World records in most events",
  "current and past",
  "[P] Person [N] Events [T] | [C] Competition [N] Events [T] | [T] Country [N] Events",
  my_merge( my_merge( $persons, $competitions ), $countries )
);

?>
