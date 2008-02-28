<?

$just3x3 = dbQuery("
  SELECT
    concat( personId, '-', personName ),
    count(pos=1 or null) gold,
    count(pos=2 or null) silver,
    count(pos=3 or null) bronze
  FROM Results
  $WHERE roundId IN ('f', 'c') AND eventId='333'
  GROUP BY personId
  ORDER BY gold DESC, silver DESC, bronze DESC, personName
  LIMIT 10
");

$overall = dbQuery("
  SELECT
    concat( personId, '-', personName ),
    count(pos=1 or null) gold,
    count(pos=2 or null) silver,
    count(pos=3 or null) bronze
  FROM Results
  $WHERE roundId IN ('f', 'c')
  GROUP BY personId
  ORDER BY gold DESC, silver DESC, bronze DESC, personName
  LIMIT 10
");

$lists[] = array(
  "Best \"medal collection\"",
  "3x3x3 and overall",
  "[P] Person [N] Gold [n] Silver [n] Bronze [T] | [P] Person [N] Gold [n] Silver [n] Bronze",
  my_merge( $just3x3, $overall )
);

?>
