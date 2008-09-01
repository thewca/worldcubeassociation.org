<?

$lists[] = array(
  "Best 3x3 Podiums",
  "",
  "[C] Competition [N] Sum [P] First [n] &nbsp; [P] Second [n] &nbsp; [P] Third [n] &nbsp;",
  bestPodium()
);

#----------------------------------------------------------------------
function bestPodium () {
#----------------------------------------------------------------------
  $results = dbQuery( "SELECT average, competitionId, concat(personId,'-',personName) person, pos
                       FROM Results
                       WHERE pos<4 AND eventId='333' AND formatId='a' AND roundId='f'
                       ORDER BY competitionId, roundId, pos ");

  foreach( $results as $result ){
    extract( $result );
    $compact_list["$competitionId"]["$pos"] = $average;
    $compact_list["$competitionId"]["p$pos"] = $person;
    $compact_list["$competitionId"]['sum'] += $average;
  }

  uasort ($compact_list, "compare");

  foreach( $compact_list as $comp => $values ) 
    $list[] = array( $comp, formatValue( $values['sum'], 'time' ),
                     $values['p1'], formatValue( $values['1'], 'time' ),
                     $values['p2'], formatValue( $values['2'], 'time' ),
                     $values['p3'], formatValue( $values['3'], 'time' ));

  return array_slice( $list, 0, 10 );

}

#----------------------------------------------------------------------
function compare ( $a, $b ) {
#----------------------------------------------------------------------

  return ($a['sum'] > $b['sum']);
}

?>
