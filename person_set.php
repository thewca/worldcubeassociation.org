<?php

$currentSection = 'persons';
require( 'includes/_header.php' );

/* build up form */
$form = new WCAClasses\FormBuilder("photo-submissions", array('method' => 'POST' , 'enctype' => 'multipart/form-data'));
$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<fieldset><legend>Photo Submission</legend>"));

$file_element = new WCAClasses\FormBuilderEntities\Input("picture", "file");
$file_element->attribute("accept", "image/*")->label("Select Photo")->validator("");
$form->addEntity($file_element);

$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<p>Please enter your Birthdate:<br />"));

    $birthday_element = new WCAClasses\FormBuilderEntities\Select("year", array_combine(range(1900,date("Y")), range(1900,date("Y"))));
    $birthday_element->label("Year");
    $form->addEntity($birthday_element);

    $birthday_element = new WCAClasses\FormBuilderEntities\Select("month", array_combine(range(1,12), range(1,12)));
    $birthday_element->label("Month");
    $form->addEntity($birthday_element);

    $birthday_element = new WCAClasses\FormBuilderEntities\Select("day", array_combine(range(1,31), range(1,31)));
    $birthday_element->label("Day");
    $form->addEntity($birthday_element);

    $form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</p>"));

    $submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
    $submit_element->attribute("value", "Submit!");
    $form->addEntity($submit_element);

$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</fieldset>"));


/* process form submissions */
if($form->submitted()) {
    $submitted_data = $form->submittedData();
    if(!isset($_FILES['picture'])) { $_FILES['picture'] = NULL; }

    // Extra validation: verify birthdate
    $result = $wcadb_conn->boundQuery("SELECT * FROM Persons WHERE id = ? AND year = ? AND month = ? AND day = ?",
                                        array('siii',
                                                &$submitted_data['personId'],
                                                &$submitted_data['year'],
                                                &$submitted_data['month'],
                                                &$submitted_data['day']
                                            )
                                    );
    if(count($result) != 1) {
        $form->invalidate("year", "Incorrect birthday.")->invalidate("month")->invalidate("day");
    }

    // Check extension and types provided by human (original filename extension),
    // by agent (what the browser said) and by finfo (what the Fileinfo function
    // "mime_content_type" thinks). In the end, $file_ext is one of ''/'gif'/'jpg'/'png'.
    $extByHuman = '';
    $extByAgent = '';
    $extByFinfo = '';
    $rawByHuman = strtolower(pathinfo($_FILES['picture']['name'], PATHINFO_EXTENSION));
    $rawByAgent = $_FILES['picture']['type'];
    $rawByFinfo = mime_content_type($_FILES['picture']['tmp_name']);
    foreach (array('gif'=>'gif', 'jpeg'=>'jpg', 'png'=>'png') as $type => $ext) {
      if ($rawByHuman == $ext || $rawByHuman == $type) $extByHuman = $ext;
      if ($rawByAgent == "image/$type")                $extByAgent = $ext;
      if ($rawByFinfo == "image/$type")                $extByFinfo = $ext;
    }
    $file_ext = '';
    if ($extByHuman && $extByHuman == $extByAgent && $extByHuman == $extByFinfo) {
      $file_ext = $extByHuman;
    } else {
      $hint = ($extByHuman && $extByFinfo) ? ", and yours looks like a $extByFinfo file with wrong extension '.$extByHuman'." : '';
      $form->invalidate('picture', "You can only upload jpg/gif/png images with correct filename extension .gif/.jpg/.jpeg/.png$hint");
    }

    // Extra validation: restrict image filesize
    $max_size = 50000;
    $size = filesize($_FILES['picture']['tmp_name']);
    if($size > $max_size) {
      $form->invalidate("picture", 'The file size is too big.');
    }

    if($form->validate() === TRUE) {
        $upload_path = 'upload/';
        $file = 'p' . o($submitted_data['personId']) . "." . $file_ext;
        // Don't overwrite (or else a malicious file might be uploaded between
        // a moderator reviewing an uploaded file and accepting it).
        // Note: It's still not perfect. If two moderators review uploaded pictures at the same
        // time, a malicious file could be uploaded between both of them trying to accept an ok
        // one. We should fix this properly.
        if (getWaitingPictureFile($upload_path, $submitted_data['personId'])) {
            noticeBox(false, 'Another picture is already waiting for review, please wait.');
        } elseif (move_uploaded_file($_FILES['picture']['tmp_name'], $upload_path . $file)) {
            noticeBox(true, "Upload successful.");
        } else {
            noticeBox(false, 'Upload failed');
        }
    } else {
        showErrors($form->validate());
    }
}


/* display page / form */
// check to see if personId is set
$personId = getRawParamThisShouldBeAnException('personId');
$result = $wcadb_conn->boundQuery("SELECT * FROM Persons WHERE id = ?", array('s', &$personId));
if(count($result) != 1) {
    showErrorMessage("Unknown person id <pre>" . o($personId) . "</pre>");
    require('includes/_footer.php');
    die();
} else {
    ?>
    <p>You can submit a picture that will be displayed on your WCA profile.
    Uploaded pictures will be reviewed first before publishing on the WCA
    website. This may take a few days.</p>

    <p>The picture must meet the following requirements:</p>
    <ul>
      <li>200x300 pixels (width x height)</li>
      <li>50 KB maximum</li>
      <li>Formats accepted: jpg, gif and png</li>
    </ul>
    <?php
    print $form->render();
}
?>

<p>Go <a href="p.php?i=<?php print o($personId); ?> ">back</a></p>

<?php
require( 'includes/_footer.php' );
