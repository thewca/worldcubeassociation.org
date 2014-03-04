<?php

include "../../includes/_framework.php";

$compId = getNormalParam('competitionId');

// Load competition data from the database and check ID
$competition_data = $wcadb_conn->boundQuery( "SELECT * FROM Competitions WHERE id=?", array('s', &$compId));
if( count( $competition_data ) != 1 ){
  showErrorMessage( "unknown competitionId [".o($compId)."]" );
  die();
}
$competition_data = $competition_data[0];

print "<div class='notice'>
          Working with `".o($compId)."` Competition Data
          | <a href='../c.php?i=".o($compId)."'>Competition Results Page</a>
          | <a href='../competition_edit.php?competitionId=".$compId."&amp;password=".$competition_data['adminPassword']."'>Competition Admin Page</a> <br />
        </div>";

// Alert about any existing result/scramble data
$competition_has_results = $wcadb_conn->boundQuery( "SELECT * FROM Results WHERE competitionId=? LIMIT 1", array('s', &$compId));
if( count( $competition_has_results ) > 0 ){
  noticeBox3(-1, 'Warning: This competition already has some official results entered.  Importing more data may cause duplicate entries.');
}
$competition_has_inbox_results = $wcadb_conn->boundQuery( "SELECT * FROM InboxResults WHERE competitionId=? LIMIT 1", array('s', &$compId));
if( count( $competition_has_inbox_results ) > 0 ){
  noticeBox3(0, 'This competition is in the process of having result data uploaded.  Importing more data may cause duplicate entries.
                 <br /><a href="scripts/remove_imported_data.php?c='.o($compId).'" id="clear_comp_data">Clear the below Results/Person/Scramble data...</a>');
}
$competition_has_scrambles = $wcadb_conn->boundQuery( "SELECT * FROM Scrambles WHERE competitionId=? LIMIT 1", array('s', &$compId));
if( count( $competition_has_scrambles ) > 0 ){
  noticeBox3(0, 'This competition has scramble data uploaded.  Importing more data may cause duplicate entries.
                 You may remove scrambles using the interface below.');
}


print "<div id='upload_help_container'>";

// Print Some Result Data
$results_view = $wcadb_conn->boundQuery(
  "SELECT r.*, p.*,
        d.cellName as roundCellName,
        e.cellName as eventCellName
    FROM InboxResults AS r
      LEFT JOIN Events AS e ON e.id = r.eventId
      LEFT JOIN Rounds AS d ON d.id = r.roundId
      LEFT JOIN InboxPersons AS p ON p.id = r.personId
    WHERE r.competitionId = ? AND r.pos >= 1
    ORDER BY e.rank, d.rank, r.pos, r.average, r.best, p.name",
  array('s', &$compId)
  );
if(count( $results_view ) > 0) {
  print "<h1>Import in Progress - Result Data</h1>";
  tableBegin('results', 11);
  tableHeader(array('Event', 'Round', 'Person', 'Pos', 'Best', 'Average', 'Details:', '','','',''), array());
  foreach($results_view as $result) {
    tableRow(array(
      $result['eventCellName'], $result['roundCellName'], $result['name'], $result['pos'],
      formatValue($result['best']), formatValue($result['average']),
      formatValue($result['value1']),
      formatValue($result['value2']),
      formatValue($result['value3']),
      formatValue($result['value4']),
      formatValue($result['value5'])
    ));
  }
  tableEnd();
  print "<p>These results have not been fully imported.
        <a href='' class='link-external external' target='_blank'>Import them now...</a></p>";
} else {
  print "<h3>Result data upload not in progress.</h3>";
}


// Print Person Data
$persons_view = $wcadb_conn->boundQuery(
  "SELECT * from InboxPersons WHERE competitionId=? ORDER BY name",
  array('s', &$compId)
  );
if(count( $persons_view ) > 0) {
  print "<h1>Import in Progress - Person Data</h1>";
  tableBegin('results', 4);
  tableHeader(array('Name', 'WCA id', 'Country', 'Birthdate'), array());
  foreach($persons_view as $result) {
    tableRow(array($result['name'], $result['wcaId'], $result['countryId'], $result['dob']));
  }
  tableEnd();

  print "<p>These persons have not been fully imported. ";
  if(count( $results_view ) <= 0) {
    print "<a href='' class='link-external external' target='_blank'>Import them now...</a></p>";
  } else {
    print "Please finish importing all results, and run scripts before importing them.</p>";
  }

} else {
  print "<h3>Person data upload not in progress.</h3>";
}


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
if(count( $checks_table ) > 0) {
  print "<h1>Fully Imported Scramble vs Result Data</h1>";
  $good_cell_attr = 'class="good_cell"';
  $bad_cell_attr = 'class="bad_cell"';
  tableBegin('scramble_help', 4);
  tableHeader(array('Event: ', 'Round', 'Has Results Import', 'Has Scrambles'), array());
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
      $has_scrambles = 'Y&nbsp;&nbsp;&nbsp;(<a class="remove_link" href="scripts/remove_scrambles.php?c='.$compId.'&amp;e='.$round['eventId'].'&amp;r='.$round['roundId'].'&" target="_blank" title="Remove Scrambles">X</a>)';
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
} else {
  print "<h3>No fully imported result or scramble data exists.</h3>";
}

print "</div>";
