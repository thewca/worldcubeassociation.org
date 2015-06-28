<?php
#----------------------------------------------------------------------
#   Initialization.
#----------------------------------------------------------------------

$jQuery = 1;
$jQuery_chosen = 1;
$currentSection = 'admin';
require('../includes/_header.php');

adminHeadline('Person picture removal');
$upload_path = "../upload/";

$scripts = new WCAClasses\WCAScripts();
$scripts->add('data_upload_help.js');
print $scripts->getHTMLAll();

#----------------------------------------------------------------------
#   Page contents.
#----------------------------------------------------------------------

// get list of unapproved photo files
$files = getWaitingPictureFiles($upload_path);

// Form for validating submissions
$form = new WCAClasses\FormBuilder("photo-submission-removal");
$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("<fieldset><legend>WCA Profile Photo Removal</legend>"));

// really just a list of filenames
$all_files = scandir($upload_path);
$photo_files = preg_grep("/^a.*\.(jpg|png|jpeg|bmp|gif)$/i", $all_files);
$photo_files = array_combine($photo_files, $photo_files); // use filenames as keys too
$form->addEntity(new WCAClasses\FormBuilderEntities\Select("photo_file", $photo_files));

$submit_element = new WCAClasses\FormBuilderEntities\Input("submit", "submit");
$submit_element->attribute("value", "Remove");
$form->addEntity($submit_element);

$form->addEntity(new WCAClasses\FormBuilderEntities\Markup("</fieldset>"));

// process form submission
if($form->submitted()) {
  if($form->validate() === TRUE) {
    $submitted_data = $form->submittedData();

    $file = $submitted_data['photo_file'];
    // ("re")move file.
    $moved = rename($upload_path.$file, $upload_path."old/".$file);
    if($moved) {
      noticeBox(true, "Move successful.");
    } else {
      noticeBox(false, "Unable to remove photo.");
    }

  } else {
    showErrors($form->validate());
  }
}

// display form for any new needed photos
if(count($photo_files) == 0){
  // if no files to accept, then:
  print "<p>No pictures can be removed.</p>";
} else {
  // otherwise, output form:
  print $form->render();
  ?><script type="text/javascript">$("#form-element-photo_file").selectize();</script><?php
}

require( '../includes/_footer.php' );
