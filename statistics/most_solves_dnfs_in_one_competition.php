<?

$solves = polishMostSolvesDnfs( "
  SELECT    personId,
            competitionId,
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

$attempts = polishMostSolvesDnfs( "
  SELECT    personId,
            competitionId,
            count(value1=-1 or null)+
            count(value2=-1 or null)+
            count(value3=-1 or null)+
            count(value4=-1 or null)+
            count(value5=-1 or null) dnfs,
            count(value1 and value1<>-2 or null)+
            count(value2 and value2<>-2 or null)+
            count(value3 and value3<>-2 or null)+
            count(value4 and value4<>-2 or null)+
            count(value5 and value5<>-2 or null) attempts
  FROM      Results
  GROUP BY  personId, competitionId
  ORDER BY  dnfs DESC, attempts
  LIMIT     50
" );

function polishMostSolvesDnfs ( $query ) {
  foreach ( dbQuery( $query ) as $row ) {
    list( $personId, $competitionId, $ctr, $attempts ) = $row;
    if ( ! $listed[$personId]++ && count($result)<10 )
      $result[] = array( $personId, "$ctr / $attempts", $competitionId );
  }
  return $result;
}

$lists[] = array(
  "Most solves or DNFs in one competition",
  "",
  "[P] Person [N] Solves [C] Competition [T] | [P] Person [N] DNFs [C] Competition",
  my_merge( $solves, $attempts )
);

?>
