<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../includes/_header.php' );

echo "<pre>";
print_r( getRawParamsThisShouldBeAnException() );
echo "</pre>";

require( '../includes/_footer.php' );

?>
