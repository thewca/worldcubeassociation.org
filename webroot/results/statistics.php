<?php
#----------------------------------------------------------------------
#
#   This script shows the lists defined in '/includes/statistics'.
#   If you only want to add/modify those lists, you don't need to look
#   here but in that directory. There, ALL_LISTS.php explains more.
#
#----------------------------------------------------------------------

#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'statistics';
require( 'includes/_header.php' );

showContent();

require( 'includes/_footer.php' );

#----------------------------------------------------------------------
function showContent () {
#----------------------------------------------------------------------

  #--- In debug mode, just calculate freshly and don't cache
  if ( wcaDebug() ) {
    showResults();
    return;
  }

  #--- If there's no cache or this is an update request, then freshly build the cache
  if ( ! file_exists( 'generated/statistics.cache' ) || getBooleanParam( 'update8392' ) ) {
    $startTime = microtime_float();
    ob_start();
    showResults();
    file_put_contents( 'generated/statistics.cache', ob_get_contents() );
    ob_end_clean();
    $logMessage = sprintf( "%s: Updating took %.2f seconds.", wcaDate(), microtime_float()-$startTime );
    file_put_contents( 'generated/statistics.log', "$logMessage\n", FILE_APPEND );
    echo "<p>$logMessage</p>";
  }
  
  #--- Show the cache
  echo file_get_contents( 'generated/statistics.cache' );
}

#----------------------------------------------------------------------
function showResults () {
#----------------------------------------------------------------------
  
  #--- Output the page header.
  echo "<h1>Fun Statistics</h1>\n\n";
  echo "<p style='padding-left:20px;padding-right:20px;font-weight:bold'>Here you see a selection of fun statistics, based on official WCA competition results.</p>";
  echo "<p style='padding-left:20px;padding-right:20px;color:gray;font-size:10px'>Generated on " . wcaDate() . ".</p>";

  #--- Get all the list definitions.
  defineAllLists();
  global $lists;

  #--- Output the links to the individual lists.  
  echo "<ul style='padding-left:20px'>\n";
  foreach( $lists as $list )
    echo "<li style='padding-bottom:5px'><a style='color:#33C;font-weight:normal' href='#$list[0]'>$list[1]</a></li>\n";
  echo "</ul>\n\n";

  #--- Output the lists.
  $ctr = 0;
  foreach( $lists as $list )
    addList( $list, ++$ctr );
}

#----------------------------------------------------------------------
function defineAllLists () {
#----------------------------------------------------------------------
  
  #--- Compute some helpers.
  global $WHERE, $sinceDateHtml, $sinceDateMysql, $sinceDateCondition;
  
  $WHERE = "WHERE " . randomDebug() . " AND";
  
  list( $year, $month, $day ) = explode( ' ', wcaDate( "Y m d" ));
  $year = intval( $year ) - 1;
  $month = intval( $month );
  $day = intval( $day );
  $monthName = getMonthName( $month );
  
  $sinceDateHtml = "$monthName $day, $year";
  $sinceDateMysql = $year*10000 + $month*100 + $day;
  $sinceDateCondition = "(year*10000 + month*100 + day) >= $sinceDateMysql";
  
  #--- Import the list definitions.
  require( 'includes/statistics/ALL_LISTS.php' );
}

#----------------------------------------------------------------------
function addList ( $list, $legacyId ) {
#----------------------------------------------------------------------

  $competitions = readDatabaseTableWithId( 'Competitions' );

  list( $id, $title, $subtitle, $columnDefs, $rows ) = $list;
  $info = isset($list[5]) ? $list[5] : '';
  
  #--- From column definitions like "[P] Person [N] Appearances [T] | [P] Person [N] Appearances"
  #--- extract classes and names like:
  #--- ('P', 'N', 'T', 'P', 'N', 'f')
  #--- ('Person', 'Appearances, '&nbsp; &nbsp; | &nbsp; &nbsp;', 'Person', 'Appearances', '&nbsp;')
  $columnDefs = "$columnDefs [f] &nbsp;";
  $columnDefs = preg_replace( '/\\|/', ' &nbsp; &nbsp; | &nbsp; &nbsp; ', $columnDefs );
  preg_match_all( '/\[(\w+)\]\s*([^[]*[^[ ])/', $columnDefs, $matches );
  $columnClasses = $matches[1];
  $columnNames = $matches[2];

  $ctr = 0;
  foreach( $columnClasses as $class ){
        if( $class == 'P' ) ;
    elseif( $class == 'E' ) ;
    elseif( $class == 'C' ) ;

    elseif( $class == 't' ) ;
    elseif( $class == 'T' ) $attributes[$ctr] = 'class="L"';

    elseif( $class == 'N' ) $attributes[$ctr] = 'class="R2"';  # TODO
    elseif( $class == 'n' ) $attributes[$ctr] = 'class="r"';

    elseif( $class == 'R' ) $attributes[$ctr] = 'class="R2"';  # TODO
    elseif( $class == 'r' ) $attributes[$ctr] = 'class="r"';

    elseif( $class == 'f' ) $attributes[$ctr] = 'class="f"';
    else
      showErrorMessage( "Unknown column type <b>'</b>$class<b>'</b>" );
    $ctr++;
  }

  if( $subtitle )
    $subtitle = "<span style='color:#999'>($subtitle)</span>";

  if( $info ){
    $info = htmlEntities( $info, ENT_QUOTES );
    $info = "(<a title='$info' style='color:#FC0' onclick='alert(\"$info\")'>info</a>)";
  }

  $columnCount = count( $columnNames );

  echo "<div id='$id'>\n";
  TableBegin( 'results', $columnCount );
  TableCaptionNew( false, $legacyId, "$title $subtitle $info" );
  TableHeader( $columnNames, $attributes );

  #--- Display the table.
  $rowCtr = 0;
  foreach( $rows as $row ){
    $values = array();
    $numbers = '';
#    array_unshift( $row, 0 );
#    foreach( $row as $key => $value ){
    foreach( range( 0, $columnCount-2 ) as $i ){
      $value = $row[$i];
      $Class = ucfirst( $columnClasses[$i] );
      if( $Class == 'P' && $value ) $value = personLink( $value, extractRomanName( currentPersonName( $value ) ) );
      if( $Class == 'E' ) $value = eventLink( $value, eventCellName( $value ));
      if( $Class == 'C' ) $value = competitionLink( $value, $competitions[$value]['cellName'] );
      if( $Class == 'R' ) $value = formatValue( $value, isset($row['eventId']) ? valueFormat($row['eventId']) : 'time' );
      $values[] = $value;
      if( $Class == 'N' ) $numbers .= "$value|";
    }

    #--- Add the rank.
    $rowCtr++;
    $rank = (isset( $prevNumbers ) && $numbers == $prevNumbers) ? '' : $rowCtr;
###  $rank = $rowCtr;
    $prevNumbers = $numbers;
#    $values[0] = $rank;

    #--- Add the filler column cell.
    $values[] = '';

    #--- Show the row.
    TableRow( $values );
  }

  TableEnd();  
  echo "</div>\n";
}

#----------------------------------------------------------------------
function readDatabaseTableWithId ( $name ) {
#----------------------------------------------------------------------
  global $cachedDatabaseTableWithId;
  
  if( ! isset( $cachedDatabaseTableWithId[$name] ))
    foreach( dbQuery( "SELECT * FROM $name" ) as $row )
      $cachedDatabaseTableWithId[$name][$row['id']] = $row;
      
  return $cachedDatabaseTableWithId[$name];
}

#----------------------------------------------------------------------
function getMonthName ( $month ) {
#----------------------------------------------------------------------

  static $monthNames;
  if( ! $monthNames )
    $monthNames = explode( ' ', ' Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec' );
  return $monthNames[$month];
}

#----------------------------------------------------------------------
function currentPersonName ( $personId ) {
#----------------------------------------------------------------------
  $persons = readDatabaseTableWithId( 'Persons' );
  return $persons[$personId]['name'];
}

#----------------------------------------------------------------------
function my_merge () {  # call with two or more parameters
#----------------------------------------------------------------------

  #--- Get all sub-statistic data with standard length (10 rows)
  foreach( func_get_args() as $subStat )
    $subStats[] = fill10( $subStat );

  #--- Combine the sub-statistics into just one (concatenating their rows)
  foreach( range( 0, 9 ) as $i ){
    $merged[$i] = $sep = array();
    foreach( $subStats as $subStat ){
      $merged[$i] = array_merge( $merged[$i], $sep, $subStat[$i] );
      $sep = array( ' &nbsp; &nbsp; | &nbsp; &nbsp; ' );
    }
  }
  return $merged;
}

#----------------------------------------------------------------------
function fill10 ( $a ) {
#----------------------------------------------------------------------

  while ( count($a) < 10 ) {
    $emptyRow = array();
    while ( array_key_exists( count($emptyRow), $a[0] ) )
      $emptyRow[] = '';
    $a[] = $emptyRow;
  }
  return $a;
}

?>
