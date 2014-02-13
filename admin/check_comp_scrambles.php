<?php

include "../includes/_framework.php";

$compId = getNormalParam('competitionId');

#--- Load the competition data from the database.
$competition_data = $wcadb_conn->boundQuery( "SELECT * FROM Competitions WHERE id=?", array('s', &$compId));

#--- Check the competitionId.
if( count( $competition_data ) != 1 ){
  showErrorMessage( "unknown competitionId [".o($compId)."]" );
  die();
}
$competition_data = $competition_data[0];

noticeBox3(0, "Uploading scrambles for `".o($compId)."`
              | <a href='../c.php?i=".o($compId)."'>Competition Results Page</a>
              | <a href='../competition_edit.php?competitionId=".$compId."&amp;password=".$competition_data['adminPassword']."'>Competition Admin Page</a> <br />"
            );


// table to check existence of results vs scrambles
$checks_table = $wcadb_conn->boundQuery(
   "SELECT e.cellName as event, d.cellName as round, c.hasscr, c.hasevent, e.id as eventId, d.id as roundId FROM (
        SELECT s.eventId as event, s.roundId as round, s.eventId as hasscr, r.eventId as hasevent FROM
         (SELECT DISTINCT eventId, roundId, competitionId FROM Scrambles WHERE competitionId = ?) as s
        LEFT JOIN (SELECT DISTINCT eventId, roundId, competitionId FROM Results WHERE competitionId = ?) as r
        ON (s.eventId=r.eventId AND s.roundId=r.roundId)
        UNION
        SELECT r.eventId as event, r.roundId as round, s.eventId as hasscr, r.eventId as hasevent FROM
         (SELECT DISTINCT eventId, roundId, competitionId FROM Scrambles WHERE competitionId = ?) as s
        RIGHT JOIN (SELECT DISTINCT eventId, roundId, competitionId FROM Results WHERE competitionId = ?) as r
        ON (s.eventId=r.eventId AND s.roundId=r.roundId)
    ) AS c
    LEFT JOIN Events as e ON e.id=c.event
    LEFT JOIN Rounds as d ON d.id=c.round
    ORDER BY e.rank, d.rank",  // no full outer joins in mysql?!
    array('ssss', &$compId, &$compId, &$compId, &$compId)
  );

$good_cell_attr = 'class="good_cell"';
$bad_cell_attr = 'class="bad_cell"';
print "<div id='scramble_help_container'>";
tableBegin('scramble_help', 4);
tableHeader(array('Event: ', 'Round', 'Has Results', 'Has Scrambles'), array());
foreach($checks_table as $round) {
  if($round['hasevent'] && $round['hasscr']) {
    $class = 'has_both';
  } else {
    $class = 'missing';
  }

  if($round['hasscr']) {
    // link to remove scrambles for this round
    // should protect this if we keep using the php system
    // jQuery attempts to load this
    $has_scrambles = 'Y&nbsp;&nbsp;&nbsp;(<a class="remove_link" href="remove_scrambles.php?c='.$compId.'&amp;e='.$round['eventId'].'&amp;r='.$round['roundId'].'&" target="_blank" title="Remove Scrambles">X</a>)';
  } else {
    $has_scrambles = 'N';
  }

  $tableOddRow = false; // global used in tableRowStyled; we don't want stripes here.
  $tableAttributes = array('', '',
      $round['hasevent'] ? $good_cell_attr : $bad_cell_attr,
      $round['hasscr'] ? $good_cell_attr : $bad_cell_attr
    ); // global used in tableRowStyled
  tableRowStyled($class, array(
        $round['event'].": ",
        $round['round'],
        $round['hasevent'] ? "Y" : "N",
        $has_scrambles
      )
    );
}
tableEnd();
print "</div>";
