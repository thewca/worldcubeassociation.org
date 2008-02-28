<?

$rows = dbQuery("
  SELECT
    concat(personId,'-',personName),
    concat(solves/attempts*100, ' %') rate,
    solves, attempts,
    '' spacer,
    best, sum/solves average, worst
  FROM(
    SELECT
      personId,
      personName,
      count(value>0 or null) solves,
      count(value>0 or value=-1 or null) attempts,
      min(if(value>0,value,99999999999)) best,
      sum(if(value>0,value,0)) sum,
      max(if(value>0,value,0)) worst
    FROM(
      SELECT value1 value, personId, personName, eventId, competitionId FROM Results UNION ALL
      SELECT value2 value, personId, personName, eventId, competitionId FROM Results UNION ALL
      SELECT value3 value, personId, personName, eventId, competitionId FROM Results UNION ALL
      SELECT value4 value, personId, personName, eventId, competitionId FROM Results UNION ALL
      SELECT value5 value, personId, personName, eventId, competitionId FROM Results) helper,
      Competitions competition
    WHERE 1
      AND eventId = '333bf'
      AND competition.id = competitionId
      AND $sinceDateCondition
    GROUP BY personId) helper2
  $WHERE 1
    AND attempts >= 5
  ORDER BY
    solves/attempts desc, attempts desc, personName
  LIMIT 10
");
  
$lists[] = array(
  "Blindfold 3x3x3 recent success rate",
  "since $sinceDateHtml - minimum 5 attempts",
  "[P] Person [N] Rate [n] Solves [n] Attempts [t] &nbsp; [r] Best [r] Avg [r] Worst",
  $rows
);

?>
