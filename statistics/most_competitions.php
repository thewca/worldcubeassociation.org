<?

$person = dbQuery( "
  SELECT    personId, count(DISTINCT competitionId) numberOfCompetitions
  FROM      Results
  GROUP BY  personId
  ORDER BY  numberOfCompetitions DESC, personId
  LIMIT     10
" );

$event = dbQuery( "
  SELECT    eventId, count(DISTINCT competitionId) numberOfCompetitions
  FROM      Results
  GROUP BY  eventId
  ORDER BY  numberOfCompetitions DESC, eventId
  LIMIT     10
" );

$country = dbQuery( "
  SELECT    countryId, count(*) numberOfCompetitions
  FROM      Competitions
  WHERE     showAtAll
    AND     datediff( year*10000+month*100+day, curdate() ) < 0
  GROUP BY  countryId
  ORDER BY  numberOfCompetitions DESC, countryId
  LIMIT     10
" );

$lists[] = array(
  "most_competitions",
  "Most Competitions",
  "",
  "[P] Person [N] Competitions [T] | [E] Event [N] Competitions [T] | [T] Country [N] Competitions",
  my_merge( $person, $event, $country ),
  "[Person] In how many competitions the person participated. [Event] In how many competitions the event was included. [Country] How many competitions took place in the country."
);

?>
