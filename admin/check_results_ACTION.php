<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../includes/_header.php' );
adminHeadline( 'Check results', 'check_results' );

showUpdateSQL();

require( '../includes/_footer.php' );

#----------------------------------------------------------------------
function showUpdateSQL () {
#----------------------------------------------------------------------

  echo "<pre>I'm doing this:\n";
  
  foreach( getRawParamsThisShouldBeAnException() as $key => $value ){

    if( preg_match( '/^setpos([1-9]\d*)$/', $key, $match ) && preg_match( '/^[1-9]\d*$/', $value )){
      $id = $match[1];
      $command = "UPDATE Results SET pos=$value WHERE id=$id";
      echo "$command\n";
      dbCommand( $command );
    }
  }
 
  echo "\nFinished.</pre>\n";
}

?>
