<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'persons';

require( '_header.php' );

analyzeChoices();
uploadFile();
showBody();

require( '_footer.php' );

#----------------------------------------------------------------------
function analyzeChoices () {
#----------------------------------------------------------------------
  global $chosenPersonId, $chosenSubmit, $chosenYear, $chosenMonth, $chosenDay;

  $chosenPersonId = getNormalParam( 'personId' );
  $chosenSubmit   = getBooleanParam( 'submit' );
  $chosenYear     = getHtmlParam( 'year'  );
  $chosenMonth    = getHtmlParam( 'month' );
  $chosenDay      = getHtmlParam( 'day'   );
}

#----------------------------------------------------------------------
function uploadFile () {
#----------------------------------------------------------------------
  global $chosenPersonId, $chosenSubmit, $chosenYear, $chosenMonth, $chosenDay;

  if( !$chosenSubmit ) return;

  #--- Check if the person exists. If not, show an error and do no more.
  $persons = dbQuery("
    SELECT * FROM Persons WHERE id = '$chosenPersonId'
  ");

  if( ! count( $persons )){
    showErrorMessage( "Unknown person id <b>[</b>$chosenPersonId<b>]</b>" );
    return;
  }

  $person = $persons[0];

  #--- Check the birth date.
  if (( $chosenYear != $person['year'] ) or ( $chosenMonth != $person['month'] ) or ( $chosenDay != $person['day'] )){
    $error = "Incorrect birth date.";
  }

  $upload_path = 'upload/';

  $max_size = 50000;
  $size = filesize( $_FILES['picture']['tmp_name'] );

  $extensions = array( '.png', '.gif', '.jpg' );
  $extension = strrchr( $_FILES['picture']['name'], '.' ); 

  $file = 'p' . $chosenPersonId . $extension;

  // Security checks

  if( !in_array( $extension, $extensions ))
    $error = 'You must upload a file in png, gif or jpg format.';

  if( $size > $max_size )
    $error = 'The file is too big.';

  if( !isset( $error ))
  {
    if( move_uploaded_file( $_FILES['picture']['tmp_name'], $upload_path . $file))
      noticeBox( true, 'Upload successful' );
    else
      noticeBox( false, 'Upload failed' );
  }
  else
    noticeBox( false, $error );

}

#----------------------------------------------------------------------
function numberSelect ( $id, $label, $from, $to, $default ) {
#----------------------------------------------------------------------

  $result = "<select id='$id' name='$id' style='width:6em'>\n";
  foreach( range( $from, $to ) as $i ){
    if( $i == $default )
      $result .= "<option value='$i' selected='selected'>$i</option>\n";
    else
      $result .= "<option value='$i'>$i</option>\n";
  }
  $result .= "</select>\n\n";
  return "<label for='$id'>$label:</label> $result";  

}

#----------------------------------------------------------------------
function showBody () {
#----------------------------------------------------------------------
  global $chosenPersonId, $chosenYear, $chosenMonth, $chosenDay;

?>

<p>You can submit a picture that will be displayed.<p>

<p>Uploaded pictures will be reviewed first before publishing on the WCA
website. This may take a few days.</p>

<p>The picture must follow the requirements : 
<ul><li>200x300 pixels (width x height)</li>
<li>50 KB maximum</li>
<li>Formats accepted : jpg, gif and png</li></ul>

<form method="POST" action="person_set.php" enctype="multipart/form-data">
<? echo "<input type='hidden' id='personId' name='personId' value='$chosenPersonId' />"; ?>
  File: <input type="file" id="picture" name="picture" /><br /><br />
<?  echo "Enter your birth date: ";
    echo numberSelect( "day", "Day", 1, 31, $chosenDay );
    echo numberSelect( "month", "Month", 1, 12, $chosenMonth );
    echo numberSelect( "year", "Year", date("Y"), date("Y")-100, $chosenYear );
?>
  <br/><input type="submit" id="submit" name="submit" value="Submit" /><br/>
</form><br />

<p>Go <a href="p.php?i=<? echo "$chosenPersonId"; ?> ">back</a></p>

<?

}

?>
