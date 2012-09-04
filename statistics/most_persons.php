<?

$events = dbQuery("
  SELECT eventId, count(DISTINCT personId) numberOfPersons
  FROM Results
  $WHERE 1
  GROUP BY eventId
  ORDER BY numberOfPersons DESC, eventId
  LIMIT 10
");

$competitions = dbQuery("
  SELECT competitionId, count(DISTINCT personId) numberOfPersons
  FROM Results
  $WHERE 1
  GROUP BY competitionId
  ORDER BY numberOfPersons DESC, competitionId
  LIMIT 10
");

$countries = dbQuery("
  SELECT countryId, count(DISTINCT personId) numberOfPersons
  FROM Results
  $WHERE 1
  GROUP BY countryId
  ORDER BY numberOfPersons DESC, countryId
  LIMIT 10
");

$lists[] = array(
  "most_persons",
  "Most Persons",
  "",
  "[E] Event [N] Persons [T] | [C] Competition [N] Persons [T] | [T] Country [N] Persons",
  my_merge($events, $competitions, $countries ),
  "[Event] How many persons participated in the event. [Competition] How many persons participated in the competition. [Country] How many citizens of this country participated."
);

?>
