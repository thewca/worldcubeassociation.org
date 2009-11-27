<?

$solves = dbQuery("
  SELECT
    concat(personId,'-',personName),
    count(if(value1>0,1,null))+count(if(value2>0,1,null))+count(if(value3>0,1,null))+count(if(value4>0,1,null))+count(if(value5>0,1,null)) solves,
    competitionId
  FROM
    Results
  GROUP BY
    personId, competitionId
  ORDER BY
    solves DESC, personName
  LIMIT 10
");

$attempts = dbQuery("
  SELECT
    concat(personId,'-',personName),
    count(if(value1<>0,1,null))+count(if(value2<>0,1,null))+count(if(value3<>0,1,null))+count(if(value4<>0,1,null))+count(if(value5<>0,1,null)) solves,
    competitionId
  FROM
    Results
  GROUP BY
    personId, competitionId
  ORDER BY
    solves DESC, personName
  LIMIT 10
");

$lists[] = array(
  "Most solves / attempts in one competition",
  "",
  "[P] Person [N] Solves [C] Competition [T] | [P] Person [N] Attempts [C] Competition",
  my_merge( $solves, $attempts )
);

?>
