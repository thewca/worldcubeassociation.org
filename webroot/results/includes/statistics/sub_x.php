<?php

for ( $s=9; $s>=4; $s-- ) {
  $temp[] = dbQuery("
    SELECT    *
    FROM (
      SELECT    personId,
                sum((value1 between 1 and {$s}99) + (value2 between 1 and {$s}99) + (value3 between 1 and {$s}99) + (value4 between 1 and {$s}99) + (value5 between 1 and {$s}99) ) ctr
      FROM      (SELECT * FROM Results WHERE eventId='333' AND best<1000) helper
      GROUP BY  personId) helper2
    WHERE     ctr > 0
    ORDER BY  ctr DESC, personId
    LIMIT     10
  ");
}

$lists[] = array(
  "subx_3x3_solves",
  "Most Sub-X solves in Rubik's Cube",
  "",
  "[P] Name [N] &lt;10 [T] | [P] Name [N] &lt;9 [T] | [P] Name [N] &lt;8 [T] | [P] Name [N] &lt;7 [T] | [P] Name [N] &lt;6 [T] | [P] Name [N] &lt;5",
  my_merge( $temp[0], $temp[1], $temp[2], $temp[3], $temp[4], $temp[5] ),
  ""
);

?>
