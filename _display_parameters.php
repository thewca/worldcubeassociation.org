<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '_header.php' );

echo "<pre>";
print_r( getRawParamsThisShouldBeAnException() );
echo "</pre>";

require( '_footer.php' );

?>
