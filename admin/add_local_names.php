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

    $nameLines = file( $upload_path . $chosenFilename . '.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );

    foreach( $nameLines as $nameLine ){
      if( count( explode( ',', $nameLine )) != 2 ){
        showErrorMessage( "Wrong line syntax: <br /> " . htmlEscape( $nameLine ) );
        $oneBad = true;
        continue;
      }

      list( $wcaId, $localName ) = explode( ',', $nameLine );
      $wcaId = utf8_decode( $wcaId );
      $persons = dbQuery( "SELECT name personName, localName personLocalName FROM Persons WHERE id='$wcaId'" );

      if( count( $persons ) == 0 ){
        showErrorMessage( "Unknown WCA id " . htmlEscape( $wcaId ) );
        $oneBad = true;
        continue;
      }

      $person = array_shift( $persons );
      extract( $person );

      if( $chosenConfirm ){
        $localName = mysql_real_escape_string( $localName );
        dbCommand( "UPDATE Persons SET localName='$localName' WHERE id='$wcaId'" );
        $oneGood = true;
      }

      else{

        if( $localName == ''){
          if( $personLocalName == '' ){}
          else{
            echo "<span style='color:#F00'>I will remove name ".htmlEscape( $personLocalName )." from ".htmlEscape( $personName )."($wcaId)</span><br />\n";
          }
        }

        else{
          if( $personLocalName == '' ){
            echo "<span style='color:#3C3'>I will add name ".htmlEscape( $localName )." to ".htmlEscape( $personName )."($wcaId)</span><br />\n";
          }
          else{
            echo "<span style='color:#DB0'>I will change name ".htmlEscape( $personLocalName )." to ".htmlEscape( $localName )." for ".htmlEscape( $personName )."($wcaId)</span><br />\n";
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

    echo "<p><b>This script *CAN* affect the database, namely if you tell it to.</b></p>\n";

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
