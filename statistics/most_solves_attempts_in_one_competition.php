<?

$solves = dbQuery("
  SELECT
    concat(personId,'-',personName),
    count(*) solves,
    competitionId
  FROM
    (select value1 value, personId, personName, competitionId, countryId from Results union all
     select value2 value, personId, personName, competitionId, countryId from Results union all
     select value3 value, personId, personName, competitionId, countryId from Results union all
     select value4 value, personId, personName, competitionId, countryId from Results union all
     select value5 value, personId, personName, competitionId, countryId from Results) x
  $WHERE
    value > 0
  GROUP BY
    personId, competitionId
  ORDER BY
    solves DESC, personName
  LIMIT 10
");

$attempts = dbQuery("
  SELECT
    concat(personId,'-',personName),
    count(*) solves,
    competitionId
  FROM
    (select value1 value, personId, personName, competitionId, countryId from Results union all
     select value2 value, personId, personName, competitionId, countryId from Results union all
     select value3 value, personId, personName, competitionId, countryId from Results union all
     select value4 value, personId, personName, competitionId, countryId from Results union all
     select value5 value, personId, personName, competitionId, countryId from Results) x
  $WHERE
    value <> 0
  GROUP BY
    personId, competitionId
  ORDER BY
    solves DESC, personName
  LIMIT 10
");

$lists[] = array(
  "Most solves / attempts in one competition",
  "",
  "[P] Person [N] Solves [C] Competition [T] | [P] Person [N] Attempts [C] Competition",
  my_merge( $solves, $attempts )
);

?>
