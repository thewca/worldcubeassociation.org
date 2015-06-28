<?php

$persons = dbQuery("
  SELECT    personId, count(DISTINCT competition.countryId) numberOfCountries
  FROM      Results result, Competitions competition
  $WHERE    competition.id = competitionId
  AND       competition.countryId NOT REGEXP '^X[A-Z]{1}$'
  GROUP BY  personId
  ORDER BY  numberOfCountries DESC, personName
  LIMIT     10
");

$events = dbQuery("
  SELECT    eventId, count(DISTINCT competition.countryId) numberOfCountries
  FROM      Results result, Competitions competition
  $WHERE    competition.id = competitionId
  AND       competition.countryId NOT REGEXP '^X[A-Z]{1}$'
  GROUP BY  eventId
  ORDER BY  numberOfCountries DESC, eventId
  LIMIT     10
");

$competitions = dbQuery("
  SELECT    competitionId, count(DISTINCT result.countryId) numberOfCountries
  FROM      Results result
  WHERE     result.countryId NOT REGEXP '^X[A-Z]{1}$'
  GROUP BY  competitionId
  ORDER BY  numberOfCountries DESC, competitionId
  LIMIT     10
");

$lists[] = array(
  "most_countries",
  "Most Countries",
  "",
  "[P] Person [N] Countries [T] | [E] Event [N] Countries [T] | [C] Competition [N] Countries",
  my_merge( $persons, $events, $competitions ),
  "[Person] In how many countries the person participated. [Event] In how many countries the event has been offered. [Competition] Of how many countries persons participated."
);
