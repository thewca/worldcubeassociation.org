<?

$rows = 0;
foreach( split( ' ', 'personId eventId competition.countryId' ) as $source ){
  $source2 = ( $source != 'personId' ) ? $source : "personId";
  $source3 = ( $source != 'personId' ) ? $source : "personName";
  $r = dbQuery("
    SELECT $source2, count(DISTINCT competitionId) numberOfCompetitions
    FROM Results, Competitions competition
    $WHERE competition.id = competitionId
    GROUP BY $source
    ORDER BY numberOfCompetitions DESC, $source3
    LIMIT 10
  ");
  $rows = $rows ? my_merge( $rows, $r ) : $r;
}

$lists[] = array(
  "Most Competitions",
  "",
  "[P] Person [N] Competitions [T] | [E] Event [N] Competitions [T] | [T] Country [N] Competitions",
  $rows,
  "[Person] In how many competitions the person participated. [Event] In how many competitions the event was included. [Country] How many competitions took place in the country."
);

?>
