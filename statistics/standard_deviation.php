<?

$lists[] = array(
  "3x3x3 best standard deviation",
  "",
  "[P] Person [T] Standard Deviation [t] Times",
  sdRanking()
  );

function sdRanking () {
  global $WHERE;
  
  #--- Get ...
  $results = dbQuery("
    SELECT personName, personId, value1, value2, value3, value4, value5,
      (((value1*value1 + value2*value2 + value3*value3 + value4*value4 + value5*value5) / 5) - (((value1 + value2 + value3 + value4 + value5) / 5)*((value1 + value2 + value3 + value4 + value5) / 5))) sd
    FROM Results result
    $WHERE 1
      AND eventId = '333'
      AND value1 > 0
      AND value2 > 0
      AND value3 > 0
      AND value4 > 0
      AND value5 > 0
    ORDER BY sd, personName
    LIMIT 0, 10
  ");
 
  foreach( $results as $result){
    extract( $result );

    $rows[] = array( $personId, formatValue( sqrt( $sd ), 'time' ), formatAverageSources( true, $result, 'time' ));
  }

  return $rows;

}

?>
