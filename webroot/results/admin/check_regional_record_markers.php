<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
analyzeChoices();
adminHeadline( 'Check regional record markers' );
showDescription();
showChoices();

if( $chosenShow )
  doTheDarnChecking();

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p>This computes regional record markers for all successful results (value>0). If a result has a stored or computed regional record marker, it is displayed. If the two markers differ, they're shown in red/green.</p>\n\n";

  echo "<p>Only strictly previous competitions (other.<b>end</b>Date &lt; this.<b>start</b>Date) are used to compare, not overlapping competitions. Thus I might wrongfully compute a too good record status (because a result was actually beaten earlier in an overlapping competition) but I should never wrongfully compute a too bad record status.</p>\n\n";

  echo "<p>Inside the same competition, results are sorted first by round, then by value, and then they're declared records on a first-come-first-served basis. This results in the records-are-updated-at-the-end-of-each-round rule you requested.</p>\n\n";

  echo "<p>A result does not need to beat another to get a certain record status, equaling is good enough.</p>\n\n";

  echo "<p>If you choose 'All' both for event and competition, I only show the differences (otherwise the page would be huge).</p>\n\n";

  echo "<hr />\n\n";
}

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenEventId, $chosenCompetitionId, $chosenShow, $chosenAnything;

  $chosenEventId        = getNormalParam( 'eventId' );
  $chosenCompetitionId  = getNormalParam( 'competitionId' );
  $chosenShow           = getBooleanParam( 'show' );

  $chosenAnything = $chosenEventId || $chosenCompetitionId;
}

#----------------------------------------------------------------------
function showChoices () {
#----------------------------------------------------------------------

  displayChoices( array(
    eventChoice( false ),
    competitionChoice(),
    choiceButton( true, 'show', 'Show' )
  ));
}

#----------------------------------------------------------------------
function doTheDarnChecking () {
#----------------------------------------------------------------------
  global $differencesWereFound;


  #--- Begin form and table.
  echo "<form action='check_regional_record_markers_ACTION.php' method='post'>\n";
  tableBegin( 'results', 12 );

  #--- Do the checking.
  computeRegionalRecordMarkers( 'best', 'Single' );
  computeRegionalRecordMarkers( 'average', 'Average' );

  #--- End table.
  tableEnd();

  #--- Tell the result.
  $date = wcaDate();
  noticeBox2(
    ! $differencesWereFound,
    "We completely agree.<br />$date",
    "<p>Darn! We disagree!<br />$date</p>
     <p>Choose the changes you agree with above, then click the 'Execute...' button below. It will result in something like the following.
        If you then go back in your browser and refresh the page, the changes should be visible.</p>
        \n<pre>
            Queries similar to the following will be executed:
              UPDATE Results SET regionalSingleRecord = ? WHERE id = ?
              UPDATE Results SET regionalAverageRecord = ? WHERE id = ?
          </pre>"
  );

  #--- If differences were found, offer to fix them.
  if( $differencesWereFound )
    echo "<center><input type='submit' value='Execute the agreed changes!' /></center>\n";

  #--- Finish the form.
  echo "</form>\n";
}

#----------------------------------------------------------------------
function computeRegionalRecordMarkers ( $valueId, $valueName ) {
#----------------------------------------------------------------------
  global $chosenAnything, $chosenCompetitionId, $differencesWereFound, $previousRecord, $pendingCompetitions, $startDate;

  # -----------------------------
  # Description of the main idea:
  # -----------------------------
  # Get all results that are potential regional records. Process them one
  # event at a time. Inside, process them one competition at a time, in
  # chronological order of start date. Each competition's results are only
  # compared against records of strictly previous competitions, not against
  # parallel competitions. For this, there are these main arrays:
  #
  # - $previousRecord[regionId] is a running collection of each region's record,
  #   covering all competitions *before* the current one.
  #
  # - $record[regionId] is based on $previousRecord and is used and updated
  #   inside the current competition.
  #
  # - $pendingCompetitions[regionId] holds $record of competitions already
  #   processed but not merged into $previousRecord. When a new competition is
  #   encountered, we merge those that ended before the new one into $previousRecord.
  #
  # - $baseRecord[eventId][regionId] is for when a user chose a specific
  #   competition to check. Then we quickly ask the database for the current
  #   region records from before that competition. This could be used for
  #   giving the user a year-option as well, but we don't have that (yet?).
  # -----------------------------

  #--- If a competition was chosen, we need all records from before it
  if ( $chosenCompetitionId ) {
    $startDate = getCompetitionValue( $chosenCompetitionId, "year*10000 + month*100 + day" );
    $results = dbQueryHandle("
      SELECT eventId, result.countryId, continentId, min($valueId) value, event.format valueFormat
      FROM Results result, Competitions competition, Countries country, Events event
      WHERE $valueId > 0
        AND competition.id = result.competitionId
        AND country.id     = result.countryId
        AND event.id       = result.eventId
        AND endYear*10000 + if(endMonth,endMonth,month)*100 + if(endDay,endDay,day) < $startDate
      GROUP BY eventId, countryId");
    while( $row = mysql_fetch_row( $results ) ) {
      list( $eventId, $countryId, $continentId, $value, $valueFormat ) = $row;
      if( isSuccessValue( $value, $valueFormat ))
        foreach( array( $countryId, $continentId, 'World' ) as $regionId )
          if( !isset($baseRecord[$eventId][$regionId]) || $value < $baseRecord[$eventId][$regionId] )
            $baseRecord[$eventId][$regionId] = $value;
    }
    mysql_free_result( $results );
  }
  #--- Otherwise we need the endDate of each competition
  else {
    $competitions = dbQuery("
      SELECT id, endYear*10000 + if(endMonth,endMonth,month)*100 + if(endDay,endDay,day) endDate
      FROM   Competitions competition");
    foreach ( $competitions as $competition )
      $endDate[$competition['id']] = $competition['endDate'];
  }

  #--- The IDs of relevant results (those already marked as region record and those that could be)
  $queryRelevantIds = "
   (SELECT id FROM Results WHERE regional${valueName}Record<>'' " . eventCondition() . competitionCondition() . ")
   UNION
   (SELECT id
    FROM
      Results result,
      (SELECT eventId, competitionId, roundTypeId, countryId, min($valueId) value
       FROM Results
       WHERE $valueId > 0
       " . eventCondition() . competitionCondition() . "
       GROUP BY eventId, competitionId, roundTypeId, countryId) helper
    WHERE result.eventId       = helper.eventId
      AND result.competitionId = helper.competitionId
      AND result.roundTypeId       = helper.roundTypeId
      AND result.countryId     = helper.countryId
      AND result.$valueId      = helper.value)";

  #--- Get the results, ordered appropriately
  $results = dbQueryHandle("
    SELECT
      year*10000 + month*100 + day startDate,
      result.id resultId,
      result.eventId,
      result.competitionId,
      result.roundTypeId,
      result.personId,
      result.personName,
      result.countryId,
      result.regional${valueName}Record storedMarker,
      $valueId value,
      continentId,
      continent.recordName continentalRecordName,
      event.format valueFormat
    FROM
      ($queryRelevantIds) relevantIds,
      Results      result,
      Competitions competition,
      Countries    country,
      Continents   continent,
      Events       event,
      RoundTypes   roundType
    WHERE 1
      AND result.id      = relevantIds.id
      AND competition.id = result.competitionId
      AND roundType.id   = result.roundTypeId
      AND country.id     = result.countryId
      AND continent.id   = country.continentId
      AND event.id       = result.eventId
    ORDER BY event.rank, startDate, competitionId, roundType.rank, $valueId
  ");

  #--- For displaying the dates, fetch all competitions
  $allCompetitions = array();
  foreach ( dbQuery("SELECT * FROM Competitions") as $row )
    $allCompetitions[$row['id']] = $row;

  #--- Process each result.
  $currentEventId = $announcedEventId = $announcedRoundId = $announcedCompoId = NULL;
  while( $row = mysql_fetch_row( $results )){
    list( $startDate, $resultId, $eventId, $competitionId, $roundTypeId, $personId, $personName, $countryId, $storedMarker, $value, $continentId, $continentalRecordName, $valueFormat ) = $row;

    #--- Handle failures of multi-attempts.
    if( ! isSuccessValue( $value, $valueFormat ))
      continue;

    #--- At new events, reset everything
    if ( $eventId != $currentEventId ) {
      $currentEventId = $eventId;
      $currentCompetitionId = false;
      $record = $previousRecord = isset($baseRecord[$eventId]) ? $baseRecord[$eventId] : array();
      $pendingCompetitions = array();
    }

    #--- Handle new competitions.
    if ( $competitionId != $currentCompetitionId ) {

      #--- Add the records of the previously current competition to the set of pending competition records
      if ( $currentCompetitionId )
        $pendingCompetitions[] = array( $endDate[$currentCompetitionId], $record );

      #--- Note the current competition
      $currentCompetitionId = $competitionId;

      #--- Prepare the records this competition will be based on
      $pendingCompetitions = array_filter ( $pendingCompetitions, "handlePendingCompetition" );
      $record = $previousRecord;
    }

    #--- Calculate whether it's a new region record and update the records.
    $calcedMarker = '';
    if( !isset($record[$countryId]) || $value <= $record[$countryId] ){
      $calcedMarker = 'NR';
      $record[$countryId] = $value;
      if( !isset($record[$continentId]) || $value <= $record[$continentId] ){
        $calcedMarker = $continentalRecordName;
        $record[$continentId] = $value;
        if( !isset($record['World']) || $value <= $record['World'] ){
          $calcedMarker = 'WR';
          $record['World'] = $value;
        }
      }
    }

    #--- If stored or calculated marker say it's some regional record at all...
    if( $storedMarker || $calcedMarker ){

      #--- Do stored and calculated agree? Choose colors and update list of differences.
      $same = ($storedMarker == $calcedMarker);
      $storedColor = $same ? '999' : 'F00';
      $calcedColor = $same ? '999' : '0E0';
      if( ! $same ){
        $differencesWereFound = true;
      }

      #--- If no filter was chosen, only show differences.
      if( !$chosenAnything  &&  $same )
        continue;

      #--- Highlight regions if the calculated marker thinks it's a record for them.
      $countryName = $countryId;
      $continentName = substr( $continentId, 1 );
      $worldName = 'World';
      if( $calcedMarker )
        $countryName = "<b>$countryName</b>";
      if( $calcedMarker  &&  $calcedMarker != 'NR' )
        $continentName = "<b>$continentName</b>";
      if( $calcedMarker == 'WR' )
        $worldName = "<b>$worldName</b>";

      #--- Recognize new events/rounds/competitions.
      $announceEvent = ($eventId       != $announcedEventId); $announcedEventId = $eventId;
      $announceRound = ($roundTypeId       != $announcedRoundId); $announcedRoundId = $roundTypeId;
      $announceCompo = ($competitionId != $announcedCompoId); $announcedCompoId = $competitionId;

      #--- If new event, announce it.
      if( $announceEvent ){
        tableCaption( false, "$eventId $valueName" );
        tableHeader( explode( '|', 'Date|Competition|Round|Person|Event|Country|Continent|World|Value|Stored|Computed|Agree' ),
                     array( 7 => "class='R2'" ) );
      }

      #--- If new round/competition inside an event, add a separator row.
      if( ($announceRound || $announceCompo)  &&  ! $announceEvent )
        tableRowEmpty();

      #--- Prepare the checkbox.
      $checkbox = "<input type='checkbox' name='update$valueName$resultId' value='$calcedMarker' />";

      #--- Show the result.
      tableRow( array(
        competitionDate($allCompetitions[$competitionId]),
        competitionLink( $competitionId, $competitionId ),
        $roundTypeId,
        personLink( $personId, $personName ),
        $eventId,
        $countryName,
        $continentName,
        $worldName,
        formatValue( $value, $valueFormat ),
        "<span style='font-weight:bold;color:#$storedColor'>$storedMarker</span>",
        "<span style='font-weight:bold;color:#$calcedColor'>$calcedMarker</span>",
        ($same ? '' : $checkbox)
      ));
    }
  }
  mysql_free_result( $results );
}

#----------------------------------------------------------------------
function handlePendingCompetition ( $pendingCompetition ) {
#----------------------------------------------------------------------
  global $previousRecord, $startDate;

  list( $endDate, $pendingRecord ) = $pendingCompetition;
  if ( $endDate >= $startDate ) return true;
  foreach ( $pendingRecord as $regionId => $value )
    if ( !isset($previousRecord[$regionId]) || $pendingRecord[$regionId] < $previousRecord[$regionId] )
      $previousRecord[$regionId] = $pendingRecord[$regionId];
  return false;
}

?>
