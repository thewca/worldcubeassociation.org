<?php

require_once( 'includes/_framework.php' );

getCompetitions();
showMap();

#----------------------------------------------------------------------
function getCompetitions () {
#----------------------------------------------------------------------
  global $chosenCompetitions;

  $chosenPersonId = getNormalParam( 'i' );

  $chosenCompetitions = dbQuery("
    SELECT 
      competition.*
    FROM
      Results result,
      Competitions competition
    WHERE 1
      AND result.personId='$chosenPersonId'
      AND competition.id = result.competitionId
    GROUP BY
      competition.id
    ORDER BY
      latitude, longitude, year, month, day");
}

#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  global $chosenCompetitions;
 
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<head>
<title>World Cube Association - Official Results</title>
</head>
<body>
<? displayMap( 800, 400 ); ?>
</body>
</html>

<? } ?>
