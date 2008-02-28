<? require( '_framework.php' ) ?>

<?php

  #--- Get data of the (matching) competitions.
  $competitions = dbQuery("
    SELECT DISTINCT
      competition.*,
      country.name AS countryName
    FROM
      Competitions competition,
      Countries    country
    WHERE 1
      AND country.id = countryId
    ORDER BY
      year DESC, month DESC, day DESC
  ");

  foreach( $competitions as $competition ){
    extract( $competition );
    echo $id."|".$name."|".$cityName."|".$countryId."|".$year."|".$month."|".$day."#";
  }

?>
