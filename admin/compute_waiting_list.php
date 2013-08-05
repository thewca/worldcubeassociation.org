<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
analyzeChoices();
adminHeadline( 'Compute competition waiting list' );

computeWaitingList();

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  $chosenCompetitionId  = getNormalParam( 'id' );

}

#----------------------------------------------------------------------
function computeWaitingList () {
#----------------------------------------------------------------------
  global $chosenCompetitionId;

  $competition = getFullCompetitionInfos( $chosenCompetitionId );

  # Get specification of all events.
  foreach( getAllEventIds() as $eventId ){
    $eventNumber[$eventId] = 0;
    if( preg_match( "/(^| )$eventId\b(=(\d*)\/(\d*)\/(\w*)\/(\d*)\/(\d*))?/", $competition['eventSpecs'], $matches ))
      $eventsSpecs[$eventId] = $matches;
  }


  $competitors = dbQuery( "SELECT * FROM Preregs WHERE competitionId='$chosenCompetitionId' ORDER BY id" );
 
  foreach( $competitors as $competitor ){

    $rowId        = $competitor['id'];
    $competitorId = $competitor['personId'];

    foreach( getAllEventIds() as $eventId ){ 
      if( $competitor["E$eventId"] > 0 ){

        $competitorNew = $competitor["E$eventId"];
 
        # Deal with time limit.
        if( $eventsSpecs[$eventId][4] ){

          if( $eventsSpecs[$eventId][5] == 's' ){
            # Fetch the best single
            $best = dbQuery( "SELECT * FROM RanksSingle WHERE eventId = '$eventId' AND personId = '$competitorId'" );
          }

          if( $eventsSpecs[$eventId][5] == 'a' ){
            # Fetch the best average
            $best = dbQuery( "SELECT * FROM RanksAverage WHERE eventId = '$eventId' AND personId = '$competitorId'" );
          }
         
          if( count( $best ) == 0 ){
           /* if( $eventsSpecs[$eventId][6] == 1 )
              $competitorNew = 2;
            else*/
              $competitorNew = 3;
          }

          else {
            $best = $best[0]['best'];
 
            if( $eventId == '333mbf' ){ # TODO : Fetch also the best of mbo !

              $value = $best;
              $old = intval( $value / 1000000000);

              if ( $old ) {

                $time      = $value % 100000; $value = intval( $value / 100000 );
                $attempted =      $value % 100; $value = intval( $value / 100 );
                $solved    = 99 - $value % 100; $value = intval( $value / 100 );
              }

              else {

                $missed     = $value % 100; $value = intval( $value / 100 );
                $time       = $value % 100000; $value = intval( $value / 100000 );
                $difference = 99 - $value % 100;
                $solved     = $difference + $missed;

              }
              $best = 2 * $eventsSpecs[$eventId][4] - $solved;
            }

            if( $best > $eventsSpecs[$eventId][4] ){
              if(( $eventsSpecs[$eventId][6] == 1 ) && ( $best <= $eventsSpecs[$eventId][7] ))
                $competitorNew = 2;
              else
                $competitorNew = 3;
            }
            else
              $competitorNew = 1;
          }
        }

        /*
        # Deal with number limit.
        if( $eventsSpecs[$eventId][3] ){

          if( $eventsSpecs[$eventId][4] && ($eventsSpecs[$eventId][6] == 1)){

            # Limit the number of qualifies.
            if( $competitorNew == 2 ){
              $eventNumber[$eventId] += 1;
              if( $eventNumber[$eventId] > $eventsSpecs[$eventId][3] )
                $competitorNew = 3;
            }
          }

          else{

            #Limit the number of registration. 
            $eventNumber[$eventId] += 1;
            if( $eventNumber[$eventId] > $eventsSpecs[$eventId][3] )
              $competitorNew = 3;
          }
        }
        */
        if( $competitor["E$eventId"] != $competitorNew )
          dbCommand( "UPDATE Preregs SET E$eventId='$competitorNew' WHERE id='$rowId'" );
      }
    }
  }

  noticeBox ( TRUE, "Waiting list was successfully computed." );
  echo "<a href='competition_edit.php?competitionId=$chosenCompetitionId&rand=" . rand() . "'>Back</a> to editing $chosenCompetitionId";
}

?>
