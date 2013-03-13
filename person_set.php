<?php
$currentSection = 'persons';
require( 'includes/_header.php' );


$chosenPersonId = getNormalParam( 'personId' );
$chosenSubmit   = getBooleanParam( 'submit' );
$chosenYear     = getHtmlParam( 'year'  );
$chosenMonth    = getHtmlParam( 'month' );
$chosenDay      = getHtmlParam( 'day'   );

if($chosenSubmit) {
  #--- Check if the person exists. If not, show an error and do no more.
  $persons = $wcadb_conn->dbQuery("SELECT * FROM Persons WHERE id = '{$chosenPersonId}'");

  if(count($persons) != 1) {
    showErrorMessage( "Unknown person id <b>[</b>{$chosenPersonId}<b>]</b>." );
  } else {
    $person = $persons[0];
    $errors = array();

    #--- Check the birth date.
    if (( $chosenYear != $person->year ) or ( $chosenMonth != $person->month ) or ( $chosenDay != $person->day )){
      $errors[] = "Incorrect birth date.";
    }

    $upload_path = 'upload/';

    $max_size = 50000;
    $size = filesize($_FILES['picture']['tmp_name']);

    $file_ext = "";
    if ($_FILES['picture']['type'] == "image/gif") {
      $file_ext = "gif";
    } elseif ($_FILES['picture']['type'] == "image/png") {
      $file_ext = "png";    
    } elseif ($_FILES['picture']['type'] == "image/jpeg") {
      $file_ext = "jpg";
    }
    $file = 'p' . $chosenPersonId . "." . $file_ext;

    if("" == $file_ext) {
      $errors[] = 'You must upload a file in png, gif, or jpg format.';
    }

    if($size > $max_size) {
      $errors[] = 'The file size is too big.';
    }

    if(count($errors) == 0) {
      if( move_uploaded_file( $_FILES['picture']['tmp_name'], $upload_path . $file)) {
        noticeBox( true, "Upload successful." );
      } else {
        noticeBox( false, 'Upload failed' );
      }
    } else {
      showErrors($errors);
    }
  }
}

?>

<p>You can submit a picture that will be displayed on your WCA profile.
Uploaded pictures will be reviewed first before publishing on the WCA
website. This may take a few days.</p>

<p>The picture must meet the following requirements:</p>
<ul>
  <li>200x300 pixels (width x height)</li>
  <li>50 KB maximum</li>
  <li>Formats accepted : jpg, gif and png</li>
</ul>

<form method="POST" enctype="multipart/form-data">
  <fieldset>
    <legend>Photo Upload</legend>
    <?php echo "<input type='hidden' id='personId' name='personId' value='{$chosenPersonId}' />"; ?>
    <strong>File:</strong><br />
    <input type="file" id="picture" name="picture" /><br />
    <br />
    <strong>Enter your birthdate:</strong><br />
    <?php
      echo numberSelect( "year", "Year", date("Y"), date("Y")-100, $chosenYear );
      echo numberSelect( "month", "Month", 1, 12, $chosenMonth );
      echo numberSelect( "day", "Day", 1, 31, $chosenDay );
    ?><br />
    <br /><input type="submit" id="submit" name="submit" value="Submit" />
  </fieldset>
</form>

<p>Go <a href="p.php?i=<?php print $chosenPersonId; ?> ">back</a></p>

<?php
require( 'includes/_footer.php' );
?>
