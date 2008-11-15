<?php

showMap();

#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  
  tableBegin( 'results', 1 );
  tableCaption( false, 'Map' );
  tableEnd();

  echo '<div id="map" style="width: 100%; height: 480px"></div>';

}

?>
