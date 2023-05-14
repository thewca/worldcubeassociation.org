<?php

$currentSection = 'admin';
include "../../includes/_framework.php";

$compId = getNormalParam('competitionId');
$compIdUrl = getNormalParam('competitionId');

// Load competition data from the database and check ID
$competition_data = $wcadb_conn->boundQuery( "SELECT * FROM Competitions WHERE id=?", array('s', &$compId));
if( count( $competition_data ) != 1 ){
  noticeBox3(1, 'Please select a competition.');
  die();
}
$competition_data = $competition_data[0];

print "<div class='notice'>
          Working with `$compIdUrl` Competition Data
          | <a href='/competitions/$compId'>Competition Results Page</a>
          | <a href='/competitions/$compId/edit/admin'>Competition Admin Page</a> <br />
        </div>";

// Alert about any existing result/scramble data
$competition_has_results = $wcadb_conn->boundQuery( "SELECT * FROM Results WHERE competitionId=? LIMIT 1", array('s', &$compId));
$competition_has_scrambles = $wcadb_conn->boundQuery( "SELECT * FROM Scrambles WHERE competitionId=? LIMIT 1", array('s', &$compId));
$competition_has_inbox_results = $wcadb_conn->boundQuery( "SELECT * FROM InboxResults WHERE competitionId=? LIMIT 1", array('s', &$compId));
$competition_has_inbox_persons = $wcadb_conn->boundQuery( "SELECT * FROM InboxPersons WHERE competitionId=? LIMIT 1", array('s', &$compId));

if( count( $competition_has_inbox_results ) > 0 || count($competition_has_inbox_persons) > 0){
  noticeBox3(1, "This competition is in the process of having result data uploaded.
                 <a href='scripts/remove_imported_data.php?c=$compIdUrl' class='call_and_refresh'>Clear the temporary Results/Person data below...</a>");
}

// if there is no data at all, nothing has been uploaded, so let's not display anything:
$competition_has_scrambles = $wcadb_conn->boundQuery( "SELECT * FROM Scrambles WHERE competitionId=? LIMIT 1", array('s', &$compId));
if( count( $competition_has_scrambles ) == 0
    && count( $competition_has_inbox_results ) == 0
    && count( $competition_has_results ) == 0
    && count( $competition_has_inbox_persons ) == 0
    ){
  noticeBox3(1, 'This competition has no data yet.  Upload something to get started.');
  die();
}


print "<div id='upload_help_container' class='thick-outlined'>";
print "<ol id='result-upload-list'>";

// print "<li><p>(todo) Perform some initial sanity checks: show table of temporary rounds vs scrambles vs # competitors, etc?</p></li>";

// Print Some Result Data
print "<li>";
$results_view = $wcadb_conn->boundQuery(
  "SELECT r.*, p.*,
        d.cellName as roundCellName,
        e.cellName as eventCellName
    FROM InboxResults AS r
      LEFT JOIN Events AS e ON e.id = r.eventId
      LEFT JOIN RoundTypes AS d ON d.id = r.roundTypeId
      LEFT JOIN InboxPersons AS p ON p.id = r.personId
    WHERE r.competitionId = ?
    AND r.pos >= 1
    AND p.competitionId = ?
    ORDER BY e.rank, d.rank, r.pos, r.average, r.best, p.name",
  array('ss', &$compId, &$compId)
  );
if(count( $results_view ) > 0) {
  print "<p><a href='scripts/import_results.php?c=$compIdUrl' class='link-external external call_and_refresh' target='_blank'>Finish importing results:</a></p>";
  print "<div class='contain-overflow'>";
  tableBegin('results', 5);
  $lastround = "";
  foreach($results_view as $result) {

    if($lastround != $result['eventCellName'] . $result['roundCellName']) {
      $lastround = $result['eventCellName'] . $result['roundCellName'];
      tableCaption(false, $result['eventCellName'] . " - " . $result['roundCellName']);
      tableHeader(array('Person', 'Pos', 'Best', 'Average', 'Details:'), array());
    }

    if($result['eventId'] == '333fm') {
      $result_format = 'number';
    } elseif($result['eventId'] == '333mbf') {
      $result_format = 'multi';
    } else {
      $result_format = 'time';
    }

    tableRow(array(
      $result['name'], $result['pos'],
      formatValue($result['best'], $result_format), formatValue($result['average'], $result_format),
      formatValue($result['value1'], $result_format)."&nbsp;&nbsp;&nbsp;"
        .formatValue($result['value2'], $result_format)."&nbsp;&nbsp;&nbsp;"
        .formatValue($result['value3'], $result_format)."&nbsp;&nbsp;&nbsp;"
        .formatValue($result['value4'], $result_format)."&nbsp;&nbsp;&nbsp;"
        .formatValue($result['value5'], $result_format)
    ));
  }
  tableEnd();
  print "</div>";
} else {
  print "There is no result data to finish importing.";
}
print "</li>";


// Scripts should be run next...
print "<li><p>Run a couple scripts:</p>
         <ol type='a'>
           <li><a href='check_results.php?competitionId=$compIdUrl&show=Show' target='_blank' class='link-external external'>check_results</a></li>
           <li><a href='persons_check_finished.php?check=+Check+now+' target='_blank' class='link-external external'>persons_check_finished</a></li>
           <li><a href='persons_finish_unfinished.php?check=+Check+now+' target='_blank' class='link-external external'>persons_finish_unfinished</a></li>
         </ol>
       </li>";


// Print Person Data
print "<li>";
$persons_view = $wcadb_conn->boundQuery(
  "SELECT * from InboxPersons WHERE competitionId=? ORDER BY name",
  array('s', &$compId)
  );
if(count( $persons_view ) > 0) {
  if(count( $results_view ) <= 0) {
    print "<p><a href='scripts/import_persons.php?c=$compIdUrl' class='link-external external call_and_refresh' target='_blank'>Finish importing persons...</a></p>";
  } else {
    print "<p>You must finish importing results data before importing person data.</p>";
  }
  print "<div class='contain-overflow'>";
  tableBegin('results', 4);
  tableHeader(array('Name', 'WCA id', 'Country', 'Birthdate'), array());
  foreach($persons_view as $result) {
    tableRow(array($result['name'], $result['wcaId'], $result['countryId'], $result['dob']));
  }
  tableEnd();
  print "</div>";
} else {
  print "There is no person data to finish importing.";
}
print "</li>";


// more scripts...
print "<li><p>Run some more scripts:</p>
         <ol type='a'>
           <li><a href='check_rounds.php?competitionId=$compIdUrl&show=Show' target='_blank' class='link-external external'>check_rounds</a></li>
           <li><a href='check_regional_record_markers.php?competitionId=$compIdUrl&show=Show' target='_blank' class='link-external external'>check_regional_record_markers</a></li>
           <li><a href='/admin/do_compute_auxiliary_data' target='_blank' class='link-external external'>compute_auxiliary_data</a></li>
         </ol>
       </li>";


// table to check existence of results vs scrambles
print "<li><p>Sanity Checks:</p>
         <ol type='a'>
           <li><a href='/competitions/$compIdUrl/results/all?event=all' target='_blank' class='link-external external'>View the Public competition page</a></li>
           <li><a href='/competitions/$compIdUrl/edit/admin' target='_blank' class='link-external external'>Post the results</a></li>
           <li>";
$checks_table = $wcadb_conn->boundQuery(
   "SELECT e.cellName as event, d.cellName as round, c.hasscr, c.hasevent, e.id as eventId, d.id as roundTypeId FROM (
        SELECT s.eventId as event, s.roundTypeId as round, s.eventId as hasscr, r.eventId as hasevent FROM
         (SELECT DISTINCT eventId, roundTypeId, competitionId FROM Scrambles WHERE competitionId = ?) as s
        LEFT JOIN (SELECT DISTINCT eventId, roundTypeId, competitionId FROM Results WHERE competitionId = ?) as r
        ON (s.eventId=r.eventId AND s.roundTypeId=r.roundTypeId)
        UNION
        SELECT r.eventId as event, r.roundTypeId as round, s.eventId as hasscr, r.eventId as hasevent FROM
         (SELECT DISTINCT eventId, roundTypeId, competitionId FROM Scrambles WHERE competitionId = ?) as s
        RIGHT JOIN (SELECT DISTINCT eventId, roundTypeId, competitionId FROM Results WHERE competitionId = ?) as r
        ON (s.eventId=r.eventId AND s.roundTypeId=r.roundTypeId)
    ) AS c
    LEFT JOIN Events as e ON e.id=c.event
    LEFT JOIN RoundTypes as d ON d.id=c.round
    ORDER BY e.rank, d.rank",  // no full outer joins in mysql?!
    array('ssss', &$compId, &$compId, &$compId, &$compId)
  );
if(count( $checks_table ) > 0) {
  print "Compare imported scramble vs result data:<br /><br />";
  $good_cell_attr = 'class="good_cell"';
  $bad_cell_attr = 'class="bad_cell"';
  tableBegin('scramble_help', 4);
  tableHeader(array(
      'Event: ',
      'Round',
      'Fully Imported Results',
      'Fully Imported Scrambles'
    ), array());
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
      $has_scrambles = "Y&nbsp;&nbsp;&nbsp;(<a class='remove_link' href='scripts/remove_data.php?t=Scrambles&c=$compIdUrl&amp;e=${round['eventId']}&amp;r=${round['roundTypeId']}' target='_blank' title='Remove Scrambles'>X</a>)";
    } else {
      $has_scrambles = 'N';
    }

    if($round['hasevent']) {
      // link to remove results for this round
      // should protect this if we keep using the php system
      // jQuery attempts to load this
      $has_results = "Y&nbsp;&nbsp;&nbsp;(<a class='remove_link' href='scripts/remove_data.php?t=Results&c=$compIdUrl&amp;e=${round['eventId']}&amp;r=${round['roundTypeId']}' target='_blank' title='Remove Results'>X</a>)";
    } else {
      $has_results = 'N';
    }

    $tableOddRow = false; // global used in tableRowStyled; we don't want stripes here.
    $tableAttributes = array('', '',
        $round['hasevent'] ? $good_cell_attr : $bad_cell_attr,
        $round['hasscr'] ? $good_cell_attr : $bad_cell_attr
      ); // global used in tableRowStyled
    tableRowStyled($class, array(
          $round['event'].": ",
          $round['round'],
          $has_results,
          $has_scrambles
        )
      );
  }
  tableEnd();
  print "<strong style='color: #900'>Please be careful removing data!  Data in the above table is live.</strong><br />";
  print "Remove all results and scrambles only, does not affect persons: <a class='remove_link' href='scripts/remove_data.php?t=All&c=$compIdUrl' target='_blank' title='Remove All'>X ALL</a>";
} else {
  print "No fully imported result or scramble data exists to compare.";
}
print "</li></ol></li>";
print "<li><p>Good job, you're done!</p></li>";
print "</div>";


// upload form is below this; these notices go last.
if( count( $competition_has_results ) > 0 ){
  noticeBox3(0, 'This competition has result data imported. Uploading more data may cause duplicate entries.');
}

if( count( $competition_has_scrambles ) > 0 ){
  noticeBox3(0, 'This competition has scramble data uploaded. Uploading more data may cause duplicate entries.
                 You may remove scrambles using the interface above.');
}

if( count( $competition_has_inbox_results ) > 0 || count($competition_has_inbox_persons) > 0){
  noticeBox3(0, 'This competition has temporary data uploaded. Uploading more data may cause duplicate entries.');
}
