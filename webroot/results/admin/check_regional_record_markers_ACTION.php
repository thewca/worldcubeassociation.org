<?php

$currentSection = 'admin';
require( '../includes/_header.php' );
adminHeadline('Check regional record markers');
?>

<p>The following queries were executed:

<?php
foreach(getRawParamsThisShouldBeAnException() as $key => $value) {
  if(preg_match('/update(Single|Average)(\d+)/', $key, $match)) {
    // $type is 'safe' per regex matching
    $type = $match[1];
    $id = $match[2];
    $command = "UPDATE Results SET regional${type}Record = ? WHERE id = ?";
    $wcadb_conn->boundCommand($command, array('ss', &$value, &$id));

    print '<br /><br />' . highlight($command);
    print '<br />With parameters:';
    print '<br /> * <span style="color:#F00">' . o($value) . '</span>';
    print '<br /> * <span style="color:#F00">' . o($id) . '</span>';
    print '<br />';
  }
}
?>

</p><p>
    <a href="check_regional_record_markers.php">Back to check records</a>
</p>


<?php
require( '../includes/_footer.php' );
?>
