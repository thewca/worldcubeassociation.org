<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );

analyzeChoices();
importLocalNames();

require( '../_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenUpload, $chosenConfirm, $chosenNamesFile, $chosenFilename;

  $chosenUpload      = getBooleanParam( 'upload' );
  $chosenConfirm     = getBooleanParam( 'confirm' );
  $chosenNamesFile   = getNormalParam( 'namesFile' );
  $chosenFilename    = getNormalParam( 'filename' );

}

#----------------------------------------------------------------------
function importLocalNames () {
#----------------------------------------------------------------------
  global $chosenUpload, $chosenConfirm, $chosenNamesFile, $chosenFilename;

  $oneBad = false;
  $oneGood = false;

  if( $chosenUpload ){

    $upload_path = '../upload/';
    if( $chosenFilename == '' )
      $chosenFilename = 'tmp' . rand();

    if( ! $chosenConfirm )
      move_uploaded_file( $_FILES['namesFile']['tmp_name'], $upload_path . $chosenFilename . '.txt' );

    $nameLines = file( $upload_path . $chosenFilename . '.txt', FILE_SKIP_EMPTY_LINES );

    foreach( $nameLines as $nameLine ){
      $nameLine = rtrim( $nameLine );
      if( count( explode( ',', $nameLine )) != 2 ){
        echo "<span style='color:#F00'>Wrong line syntax: <br /> " . htmlEscape( $nameLine ) . "</span><br />\n";
        $oneBad = true;
        continue;
      }

      list( $wcaId, $localName ) = explode( ',', $nameLine );
      $wcaId = utf8_decode( $wcaId );
      $persons = dbQuery( "SELECT name personName FROM Persons WHERE id='$wcaId' AND subId=1" );

      if( count( $persons ) == 0 ){
        echo "<span style='color:#DB0'>Unknown WCA id " . htmlEscape( $wcaId ) . "</span><br />\n";
        $oneBad = true;
        continue;
      }

      $person = array_shift( $persons );
      extract( $person );

      if( $chosenConfirm ){
        $localName = mysql_real_escape_string( $localName );
        $name = mysql_real_escape_string( extractRomanName( $personName )) . ' (' . $localName . ')';
        $personName = mysql_real_escape_string( $personName );
        dbCommand( "UPDATE Persons SET name='$name' WHERE id='$wcaId' AND subId=1" );
        dbCommand( "UPDATE Results SET personName='$name' WHERE personId='$wcaId' AND personName='$personName'" );
        $oneGood = true;
      }

      else{
        $personLocalName = extractLocalName( $personName );
        if( $localName == ''){
          if( $personLocalName == '' ){}
          else{
            echo "<span style='color:#3C3'>I will remove name ".htmlEscape( $personLocalName )." from ".htmlEscape( $personName )."($wcaId)</span><br />\n";
          }
        }

        else{
          if( $personLocalName == '' ){
            echo "<span style='color:#3C3'>I will add name ".htmlEscape( $localName )." to ".htmlEscape( $personName )."($wcaId)</span><br />\n";
          }
          else{
            echo "<span style='color:#3C3'>I will change name ".htmlEscape( $personLocalName )." to ".htmlEscape( $localName )." for ".htmlEscape( $personName )."($wcaId)</span><br />\n";
          }
        }
      }
    }

    if( $chosenConfirm ){
      if(( $oneGood ) and ( ! $oneBad ))
        noticeBox3( 1, "Complete. All names were updated." );
      if(( $oneGood ) and ( $oneBad ))
        noticeBox3( 0, "Complete. However, some lines were skipped." );
      if(( ! $oneGood ) and ( $oneBad ))
        noticeBox3( -1, "Cound't update anything." );
      if(( ! $oneGood ) and ( ! $oneBad ))
        noticeBox3( 0, "I found an empty text !?" );
      $chosenUpload = false;
      unlink( $upload_path . $chosenFilename . '.txt' );
    }

    else{
      echo "<form method='POST' action='$_SERVER[PHP_SELF]'>\n";
      echo "<input type='hidden' id='namesFile' name='namesFile' value='".htmlEscape($chosenNamesFile)."' />\n";
      echo "<input type='hidden' id='upload' name='upload' value='$chosenUpload' />\n";
      echo "<input type='hidden' id='filename' name='filename' value='".htmlEscape($chosenFilename)."' />\n";
      echo "<input type='submit' id='confirm' name='confirm' value='Confirm' /></form>\n";
    }
  }

  if( ! $chosenUpload ){

    adminHeadline( 'Add local names' );

    echo "<p>You can add or modify local names here, by upload a file containing the names. The file must be a plain text file encoded in UTF-8. Each line must contain: the WCA id, a comma (',') and the name you would like to add. If you want to remove a name from the database, just leave the name part blank.</p>\n";
  
    echo "<p>Example: <br /><br />2009WANG20,王超<br />2009WANG62,王宇欣<br />2009WANG13,王宇轩<br />etc.</p>\n";
    echo "<hr>\n";

    echo "<table class='prereg'>\n";
    echo "  <form method='POST' action='$_SERVER[PHP_SELF]' enctype='multipart/form-data'>\n";
    echo "  <tr><td width='30%'><label for='namesFile'>Upload file: </label></td>\n";
    echo "      <td><input type='file' id='namesFile' name='namesFile' /></td>\n";
    echo "      <td><input type='submit' id='upload' name='upload' value='Upload' /></td></tr></form>\n";
    echo "</table>\n";
  }
}

?>
