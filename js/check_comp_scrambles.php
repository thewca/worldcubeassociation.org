<?php

include "../includes/_framework.php";

$compId = getNormalParam('competitionId');
noticeBox3(0, "Uploading scrambles for `".o($compId)."`.<br />");


// table to check existence of results vs scrambles
$checks_table = $wcadb_conn->boundQuery("SELECT e.cellName as event, d.cellName as round, c.hasscr, c.hasevent FROM (
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
  $tableOddRow = false; // global used in tableRowStyled
  $tableAttributes = array('', '',
      $round['hasevent'] ? $good_cell_attr : $bad_cell_attr,
      $round['hasscr'] ? $good_cell_attr : $bad_cell_attr
    ); // global used in tableRowStyled
  tableRowStyled($class, array(
        $round['event'].": ",
        $round['round'],
        $round['hasevent'] ? "Y" : "N",
        $round['hasscr'] ? "Y" : "N"
      )
    );
}
tableEnd();
print "</div>";
