<?php

#----------------------------------------------------------------------
#   Get the results...
#----------------------------------------------------------------------

$results = dbQuery("
  SELECT
    result.personId   personId,
    result.personName personName,

    country.id        countryId,
    country.name      countryName,

    continent.id      continentId,
    continent.name    continentName,

    competition.id       competitionId,
    competition.cellName competitionName,

    $valueSource      value,
    event.format      valueFormat,

    value1, value2, value3, value4, value5
  FROM
    (SELECT countryId recordCountryId, MIN($valueSource) recordValue
     FROM Concise${valueName}Results result
     WHERE 1 $eventCondition $yearCondition
     GROUP BY countryId) record,
    Results      result,
    Countries    country,
    Continents   continent,
    Competitions competition,
    Events       event
  WHERE " . randomDebug() . "

    #--- Only record results.
    $eventCondition
    $yearCondition
    AND result.$valueSource = recordValue
    AND result.countryId = recordCountryId

    #--- Combine the other tables.
    AND country.id     = result.countryId
    AND continent.id   = continentId
    AND competition.id = competitionId
    AND event.id       = eventId
  ORDER BY
    value, countryId, year, month, day, personName
");

#----------------------------------------------------------------------
#   Analyze the results.
#----------------------------------------------------------------------

#--- Collect national results, remember which continents to show, continental/world record values.
foreach( $results as $result ){
  extract( $result );

  if( !$chosenRegionId  ||  $countryId==$chosenRegionId  ||  $continentId==$chosenRegionId ){
    $result['regionName'] = $countryName;
    $bestOfCountry[] = $result;
    $showContinent[$continentId] = true;
  }

  if( ! $bestValueOfWorld )
    $bestValueOfWorld = $result['value'];
  if( ! $bestValueOfContinent[$continentId] )
    $bestValueOfContinent[$continentId] = $result['value'];
}

#--- Continental and world results.
foreach( $results as $result ){
  extract( $result );

  $result['regionName'] = $continentName;
  if( $showContinent[$continentId]  &&  $value == $bestValueOfContinent[$continentId] )
    $bestOfContinent[] = $result;

  $result['regionName'] = 'World';
  if( $value == $bestValueOfWorld )
    $bestOfWorld[] = $result;
}

#----------------------------------------------------------------------
#   Print the table.
#----------------------------------------------------------------------
startTimer();

$regionName = preg_replace( '/^_/', '', $chosenRegionId );
$eventName = eventName( $chosenEventId );
$headerSources = $chosenAverage ? 'Result Details' : '';

tableBegin( 'results', 5 );
tableCaption( true, spaced( array( $eventName, $chosenShow, $regionName, $chosenYears )));
tableHeader( split( '\\|', "Region|Result|Person|Competition|$headerSources" ),
             array( 0 => 'class="L"', 1 => "class='R2'", 4 => 'class="f"' ));

if( $bestOfCountry){
  $all = array_merge( $bestOfWorld, array(0), $bestOfContinent, array(0), $bestOfCountry );
  foreach( $all as $row ){
    if( !$row ){
      tableRowEmpty();
      continue;
    }
    extract( $row );
    $isNewRegion = ($regionName != $previousRegionName); $previousRegionName = $regionName;
    tableRow( array(
      $isNewRegion ? $regionName : '',
      $isNewRegion ? formatValue( $value, $valueFormat ) : '',
     personLink( $personId, $personName ),
      competitionLink( $competitionId, $competitionName ),
      formatAverageSources( $chosenAverage, $row, $valueFormat )
    ));
  }
}

tableEnd();

stopTimer( "printing the table" );

?>
