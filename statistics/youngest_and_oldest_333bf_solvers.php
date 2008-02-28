<?

#--- Get all persons and their success dates.
$persons = dbQuery("
  SELECT
    person.*,
    datediff( concat( competitionYear, '-', competitionMonth, '-', competitionDay ),
              concat( birthYear, '-', birthMonth, '-', birthDay )) ageInDays
  FROM
    (SELECT DISTINCT
        personId id, personName name,
        min(best) best,
        person.year birthYear, person.month birthMonth, person.day birthDay,
        competition.year competitionYear, competition.month competitionMonth, competition.day competitionDay
      FROM
        Results result, Persons person, Competitions competition
      $WHERE 1
        AND eventId = '333bf'
        AND result.best > 0
        AND person.id = result.personId
        AND competition.id = result.competitionId
        AND person.year > 0
      GROUP BY
        personId, personName, competitionId
    ) person
  ORDER BY
    ageInDays, best
");

$youngest = getFirstTen( $persons );
$oldest = getFirstTen( array_reverse( $persons ));

$lists[] = array(
  "Youngest and oldest 3x3 blindfolded solvers",
  "we don't know everybody's birth dates but the #1 persons should be correct",
#  "[P] Person [N] Age in days [n] Years [n] Months [n] Days [T] | [P] Person [N] Age in days [n] Years [n] Months [n] Days",
  "[P] Person [N] Years [n] Months [n] Days [R] Time [T] | [P] Person [N] Years [n] Months [n] Days [R] Time",
  my_merge( $youngest, $oldest )
);

?>
