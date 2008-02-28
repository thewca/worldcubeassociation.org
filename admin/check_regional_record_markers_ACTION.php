<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );

showUpdateSQL();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showUpdateSQL () {
#----------------------------------------------------------------------

  echo "<pre>I'm doing this:\n";
  
  foreach( getRawParamsThisShouldBeAnException() as $key => $value ){
    if( preg_match( '/update(Single|Average)(\d+)/', $key, $match )){
      $type = $match[1];
      $id = $match[2];
      $command = "UPDATE Results SET regional${type}Record='$value' WHERE id=$id";
      echo "$command\n";
      dbCommand( $command );
    }
  }
  
  echo "</pre>\n";
}

?>
