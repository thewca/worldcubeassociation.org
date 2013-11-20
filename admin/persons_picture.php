<?php
#----------------------------------------------------------------------
#   Initialization.
#----------------------------------------------------------------------

$currentSection = 'admin';
require('../includes/_header.php');

adminHeadline('Person pictures');
$upload_path = "../upload/";

#----------------------------------------------------------------------
#   Page contents.
#----------------------------------------------------------------------

// get list of unapproved photo files
$files = getWaitingPictureFiles($upload_path);

// Form for validating submissions
$form = new WCAClasses\FormBuilder("photo-submission-approval");
foreach($files as $file) {
  $personId = substr($file, 1, 10);
  $person = $wcadb_conn->boundQuery("SELECT * FROM Persons WHERE id = ?", array('s', &$personId));
  if(count($person) == 1) {
    $person = $person[0];
    $form->addEntity(new WCAClasses\FormBuilderEntities\Radio($personId, array("A" => "Accept", "D" => "Decline", "R" => "Defer")));
  } else {
    print "ERROR - picture present not associated with a valid ID (" . o($personId) . ")!";
  }
}

// process form submission
if($form->submitted()) {
  if($form->validate() === TRUE) {
    $submitted_data = $form->submittedData();
    // (re)move files that have been (dis)approved.
    foreach($files as $file){
      $personId = substr($file, 1, 10);
      if($submitted_data[$personId] == 'A'){
        acceptNewPictureFile($upload_path, $personId, $file);
      }
      if($submitted_data[$personId] == 'D') {
        unlink($upload_path . $file);
      }
    }
  } else {
    showErrors($form->validate());
  }
}

// re-read files / repopulate form.
$files = getWaitingPictureFiles($upload_path);

// display form for any new needed photos
if(count($files) == 0){
  // if no files to accept, then:
  print "<p>No new pictures have been submitted.</p>";
} else {
  // otherwise, output form:
  $form = new WCAClasses\FormBuilder("photo-submission-approval");
  $form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<fieldset><legend>Photo Submission Approval</legend>"));

  foreach($files as $file) {
    $personId = substr($file, 1, 10);
    $person = $wcadb_conn->boundQuery("SELECT * FROM Persons WHERE id = ?", array('s', &$personId));

    if(count($person) == 1) {
      $person = $person[0];
      $currentPic = getCurrentPictureFile($upload_path, $personId);
      $currentPic = $currentPic ? "<img src='$currentPic' />" : "";
      $previousPics = '';
      foreach(getPreviousPictureFiles($upload_path . 'old/', $personId) as $prevPic) {
        $previousPics .= "<img src='$prevPic' class='previous' />";
      }
      $genderText = genderText($person['gender']);
      $googleSearch = "<a href='http://images.google.com/searchbyimage?image_url=https://www.worldcubeassociation.org/results/upload/$file' class='external'>Image Search</a>";
      $form->addEntity(new WCAClasses\FormBuilderEntities\Radio($personId, array("A" => "Accept", "D" => "Decline", "R" => "Defer"), "R"));
      $form->addEntity(new WCAClasses\FormBuilderEntities\Markup(
        "<div class='titled-image'>
           <img src='" . $upload_path . $file . "' class='person' />
           <span class='titled-image-title'>New Pic For " . personLink($personId, $person['name']) . "<br />$genderText, $googleSearch</span>
         </div>"
         .($currentPic ? "<div class='titled-image'>$currentPic<span class='titled-image-title'>Current</span></div>" : '')
         .($previousPics ? "<div class='titled-image'>$previousPics<span class='titled-image-title'>Previous</span></div>" : '')
      ));
    } else {
      print "ERROR - picture present not associated with a valid ID (" . o($personId) . ")!";
    }
  }
  $submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
  $submit_element->attribute("value", "Submit!");
  $form->addEntity($submit_element);
  $form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</fieldset>"));
  print $form->render();
}

require( '../includes/_footer.php' );
