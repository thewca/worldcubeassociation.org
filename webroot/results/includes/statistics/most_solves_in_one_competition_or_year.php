<?php

$solves = polishMostSolvesAttempts( "
  SELECT    personId,
            competitionId whereId,
            sum(
              IF(value1 > 0, 1, 0) +
              IF(value2 > 0, 1, 0) +
              IF(value3 > 0, 1, 0) +
              IF(value4 > 0, 1, 0) +
              IF(value5 > 0, 1, 0)
            ) solves,
            sum(
              IF(value1 != -2 and value1 != 0, 1, 0) +
              IF(value2 != -2 and value2 != 0, 1, 0) +
              IF(value3 != -2 and value3 != 0, 1, 0) +
              IF(value4 != -2 and value4 != 0, 1, 0) +
              IF(value5 != -2 and value5 != 0, 1, 0)
            ) attempts
  FROM      Results
  GROUP BY  personId, competitionId
  ORDER BY  solves DESC, attempts
  LIMIT     50
" );

$attempts = polishMostSolvesAttempts( "
  SELECT    personId,
            year whereId,
            sum(
              IF(value1 > 0, 1, 0) +
              IF(value2 > 0, 1, 0) +
              IF(value3 > 0, 1, 0) +
              IF(value4 > 0, 1, 0) +
              IF(value5 > 0, 1, 0)
            ) solves,
            sum(
              IF(value1 != -2 and value1 != 0, 1, 0) +
              IF(value2 != -2 and value2 != 0, 1, 0) +
              IF(value3 != -2 and value3 != 0, 1, 0) +
              IF(value4 != -2 and value4 != 0, 1, 0) +
              IF(value5 != -2 and value5 != 0, 1, 0)
            ) attempts
  FROM      Results, Competitions competition
  WHERE     competition.id = competitionId
  GROUP BY  personId, year
  ORDER BY  solves DESC, attempts
  LIMIT     50
" );

$allTime = polishMostSolvesAttempts( "
  SELECT    personId,
            '' whereId,
            sum(
              IF(value1 > 0, 1, 0) +
              IF(value2 > 0, 1, 0) +
              IF(value3 > 0, 1, 0) +
              IF(value4 > 0, 1, 0) +
              IF(value5 > 0, 1, 0)
            ) solves,
            sum(
              IF(value1 != -2 and value1 != 0, 1, 0) +
              IF(value2 != -2 and value2 != 0, 1, 0) +
              IF(value3 != -2 and value3 != 0, 1, 0) +
              IF(value4 != -2 and value4 != 0, 1, 0) +
              IF(value5 != -2 and value5 != 0, 1, 0)
            ) attempts
  FROM      Results
  GROUP BY  personId
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
  "Most solves in one competition, year, or lifetime",
  "",
  "[P] Person [n] Solves [C] Competition [T] | [P] Person [n] Solves [N] Year [T] | [P] Person [n] Solves [T]",
  my_merge( $solves, $attempts, $allTime)
);

?>
