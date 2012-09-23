<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'admin';
require( '../_header.php' );

adminHeadline( 'Person pictures' );
validatePicture();

require( '../_footer.php' );

#----------------------------------------------------------------------
function validatePicture () {
#----------------------------------------------------------------------

  $upload_path = '../upload/';
  if ( $handle = opendir( $upload_path )) {
    while ( false !== ( $file = readdir( $handle ))) 
      if ($file[0] == 'p' )
        $files[] = $file;
  closedir($handle);
  }

  if( count( $files ) > 0 )
    foreach( $files as $file ){ 
      $personId = substr( $file, 1, 10 );

      if( getNormalParam( "$personId" ) == 'A' ){
        if ( $handle = opendir( $upload_path )) {
          while ( false !== ( $a_file = readdir( $handle ))) 
            if ( substr( $a_file, 0, 11 ) == ( 'a' . $personId ))
              unlink( $upload_path . $a_file );
        closedir($handle);
        }
      
        rename( $upload_path . $file, $upload_path . 'a' . substr( $file, 1) );
      }

      if( getNormalParam( "$personId" ) == 'D' )
        unlink( $upload_path . $file );
    }

  $count = 0;
  unset( $files );
  if ( $handle = opendir( $upload_path )) {
    while (( $count < 10 ) && ( false !== ( $file = readdir( $handle ))))
      if( $file[0] == 'p' ){
        $count += 1;
        $files[] = $file;
      }
  closedir($handle);
  }

  if( count( $files ) == 0 ){
    echo "<p>No picture submitted</p>";
    return;
  }

  echo "<form method='POST' action='persons_picture.php'>\n";
  echo "<table><tr><th>A</th><th>D</th><th>Name</th><th>Picture</th></tr>\n";

  foreach( $files as $file ){ 

    $personId = substr( $file, 1, 10 );
    $extension = strrchr( $file, '.' );

    $person = dbQuery( "SELECT * FROM Persons WHERE id='$personId'" );
    $person = $person[0];

    echo "<tr><td><input type='radio' id='$personId' name='$personId' value='A' /></td>\n";
    echo "<td><input type='radio' id='$personId' name='$personId' value='D' /></td>\n";
    echo "<td>" . personLink( $personId, $person['name']) . "</td>\n";
    echo "<td><img src='" . $upload_path . $file . "' width='200' height='300' /></td></tr>\n\n";

  }
  echo "</table>";
  echo "<input type='submit' value='Do !' />";
  echo "</form>";

}

?>
