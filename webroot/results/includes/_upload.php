<?php

#----------------------------------------------------------------------
function showUploadForm ($action, $hiddenFields = array()) {
#----------------------------------------------------------------------

  echo "<form method='post' action='$action' enctype='multipart/form-data'>\n";
  foreach( $hiddenFields as $name => $value )
    echo "  <input type='hidden' id='$name' name='$name' value='$value' />\n";
  echo "  <input type='file' id='file' name='file' /><br />\n";
  echo "  <input type='submit' id='submit' name='submit' value='Submit' /><br/>\n";
  echo "</form>\n";
}

#----------------------------------------------------------------------
function checkUpload ($maxSize, $allowedExtensions) {
# example: list($tempFilename, $errorText) = checkUpload(50000, array('.png', '.gif', '.jpg'))
# on success returns array(tempFilename, false)
# on failure returns array(false, errorText)
#----------------------------------------------------------------------

  #--- Check upload error provided by PHP
  $file = $_FILES["file"];
  if( $file["error"] != UPLOAD_ERR_OK )
    return array(false, "Upload failed with error code: " . $file["error"]);

  #--- Debug
  if (wcaDebug()) {
    echo "Upload: " . $file["name"] . "<br />";
    echo "Type: " . $file["type"] . "<br />";
    echo "Size: " . ($file["size"] / 1000) . " Kb<br />";
    echo "Temp file: " . $file["tmp_name"] . "<br />";
  }

  #--- Check upload size
  if( filesize( $_FILES['file']['tmp_name'] ) > $maxSize )
    return array(false, 'The file is too big.');

  #--- Check extension
  if( is_string($allowedExtensions) )
    $allowedExtensions = array($allowedExtensions);
  $extension = strtolower( strrchr( $file['name'], '.' ));
  if( !in_array( $extension, $allowedExtensions ))
    return array(false, 'Wrong filename extension, allowed are: ' . implode(' ', $allowedExtensions));

  #--- Everything ok, so return filename
  return array($file["tmp_name"], false);
}
