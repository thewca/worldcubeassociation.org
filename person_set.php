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
  global $chosenPersonId, $chosenSubmit;

  $chosenPersonId = getNormalParam( 'personId' );
  $chosenSubmit = getBooleanParam( 'submit' );
}

#----------------------------------------------------------------------
function uploadFile () {
#----------------------------------------------------------------------
  global $chosenPersonId, $chosenSubmit;

  if( !$chosenSubmit ) return;

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
function showBody () {
#----------------------------------------------------------------------
  global $chosenPersonId;

?>

<p>You can submit a picture that will be displayed.<p>

<p>Uploaded pictures will be reviewed first before publishing on the WCA
website. This may take a few days.</p>

<p>The picture must follow the requirements : 
<ul><li>200x300 pixels</li>
<li>50 Ko maximum</li>
<li>Formats accepted : jpg, gif and png</li></ul>

<form method="POST" action="person_set.php" enctype="multipart/form-data">
<? echo "<input type='hidden' id='personId' name='personId' value='$chosenPersonId'>"; ?>
  File : <input type="file" id="picture" name="picture">
  <input type="submit" id="submit" name="submit" value="Submit">
</form><br />

<p>Go <a href="p.php?i=<? echo "$chosenPersonId"; ?> ">back</a></p>

<?

}

?>
