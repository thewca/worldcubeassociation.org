<?

$solves = polishMostSolvesAttempts( "
  SELECT    personId,
            competitionId whereId,
            count(value1>0 or null)+
            count(value2>0 or null)+
            count(value3>0 or null)+
            count(value4>0 or null)+
            count(value5>0 or null) solves,
            count(value1 and value1<>-2 or null)+
            count(value2 and value2<>-2 or null)+
            count(value3 and value3<>-2 or null)+
            count(value4 and value4<>-2 or null)+
            count(value5 and value5<>-2 or null) attempts
  FROM      Results
  GROUP BY  personId, competitionId
  ORDER BY  solves DESC, attempts
  LIMIT     50
" );

$attempts = polishMostSolvesAttempts( "
  SELECT    personId,
            year whereId,
            count(value1>0 or null)+
            count(value2>0 or null)+
            count(value3>0 or null)+
            count(value4>0 or null)+
            count(value5>0 or null) solves,
            count(value1 and value1<>-2 or null)+
            count(value2 and value2<>-2 or null)+
            count(value3 and value3<>-2 or null)+
            count(value4 and value4<>-2 or null)+
            count(value5 and value5<>-2 or null) attempts
  FROM      Results, Competitions competition
  WHERE     competition.id = competitionId
  GROUP BY  personId, year
  ORDER BY  solves DESC, attempts
  LIMIT     50
" );

function polishMostSolvesAttempts ( $query ) {
  $result = array();
  foreach ( dbQuery( $query ) as $row ) {
    list( $personId, $whereId, $ctr, $attempts ) = $row;
    if ( ! isset( $listed[$personId] ) && count($result)<10 ){
      $result[] = array( $personId, "<b>$ctr</b> / $attempts", $whereId );
      $listed[$personId] = true;
    }
  }
  return $result;
}

$lists[] = array(
  "most_solves",
  "Most solves in one competition or year",
  "",
  "[P] Person [n] Solves [C] Competition [T] | [P] Person [n] Solves [N] Year",
  my_merge( $solves, $attempts )
);

?>
