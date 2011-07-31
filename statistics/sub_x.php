<?

for ( $s=9; $s>=6; $s-- ) {
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
  "Most Sub-X solves in Rubik's Cube",
  "",
  "[P] Name [N] &lt;10 [T] | [P] Name [N] &lt;9 [T] | [P] Name [N] &lt;8 [T] | [P] Name [N] &lt;7",
  my_merge( my_merge( $temp[0], $temp[1] ), my_merge( $temp[2], $temp[3] ) ),
  ""
);

?>
