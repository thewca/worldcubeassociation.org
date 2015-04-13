<?php
$currentSection = 'admin';
require_once "../../includes/_framework.php";

function error($msg,$show = 1)
{
    die('{"error": {"msg":"'.$msg.'", "show":'.$show.'} }');
}

// Sanitization

function get_GET($key,$regexp)
{
    if (!paramExists($key)) {
        return null;
    } else {
        $GET = getRawParamsThisShouldBeAnException();
        return preg_replace($regexp,'',$GET[$key]);
    }
}

function getPersonId()
{
    return get_GET('personId','/[^0-9A-Z]/');
}

function getCompetitionId()
{
    return get_GET('competitionId','/[^0-9A-Za-z]/');
}

function getEventId()
{
    return get_GET('eventId','/[^0-9a-z]/');
}

function getRoundId()
{
    return get_GET('roundId','/[^0-9a-z]/');
}

function getFix()
{
    return get_GET('fix','/[^1]/');
}

function getValue($key)
{
    return get_GET($key,'/[^0-9\-]/');
}

function getRecord($key)
{
    return get_GET($key,'/[^A-Za-z]/');
}

function getResultId()
{
    return get_GET('resultId','/[^0-9]/');
}

// script

if (getFix()) { // fix data

    if (($resultId = getResultId())===null) error('Invalid calling - no resultId');

    $values = array($resultId);
    if (!$values[] = getCompetitionId()) error('Invalid calling - no competitionId');
    if (!$values[] = getEventId()) error('Invalid calling - no eventId');
    if (!$values[] = getRoundId()) error('Invalid calling - no roundId');
    if (!$values[] = getPersonId()) error('Invalid calling - no personId');

    $result = pdo_query(
        'SELECT * FROM Results '.
        'WHERE id=? AND competitionId=? AND eventId=? AND roundId=? AND personId=? ',
        $values
    );
    if (!count($result)) error('Could not find the results to fix (!?)');

    $values = array();
    for ($i=1;$i<6;$i++) {
        if (($values[] = getValue('value'.$i))===null) error('Invalid calling - no value'.$i);
    }
    if (($values[] = getValue('best'))===null) error('Invalid calling - no best');
    if (($values[] = getValue('average'))===null) error('Invalid calling - no average');
    if (($values[] = getRecord('regionalSingleRecord'))===null) error('Invalid calling - no regionalSingleRecord');
    if (($values[] = getRecord('regionalAverageRecord'))===null) error('Invalid calling - no regionalAverageRecord');
    $values[] = $resultId;

    pdo_query(
        'UPDATE Results '.
        'SET value1=?, value2=?, value3=?, value4=?, value5=?, best=?, average=?, regionalSingleRecord=?, regionalAverageRecord=? '.
        'WHERE id=?',
        $values
    );

    die('{"success":1}');

} else { // provide data

    if (!$personId = getPersonId()) error('Invalid calling - no personId');
    if ($competitionId = getCompetitionId()) {
        if ($eventId = getEventId()) {
            $roundId = getRoundId();
        } else {
            $roundId = null;
        }
    } else {
        $eventId = null;
        $roundId = null;
    }
    $return = array();
    //
    if (!$competitionId) {
        $result = pdo_query('SELECT name FROM Persons WHERE id=?',array($personId));
        if (!count($result)) error('Person ID not found',0);
        $competitorName = $result[0]['name'];
        $return['competitorName'] = $competitorName;
        //
        $result = pdo_query(
            'SELECT Competitions.id, Competitions.name FROM '.
            '(SELECT DISTINCT competitionId FROM Results WHERE personId=?) AS t '.
            'JOIN Competitions ON Competitions.id=t.competitionId '.
            'ORDER BY year DESC, month DESC, day DESC',
            array($personId)
        );
        if (!count($result)) error('Person never competed (!?)');
        $defaultCompetition = $result[0]['id'];
        $return['competitions'] = $result;
    } else {
        $defaultCompetition = $competitionId;
    }
    //
    if (!$eventId) {
        $result = pdo_query(
            'SELECT Events.id, Events.name FROM '.
            '(SELECT DISTINCT eventId FROM Results WHERE competitionId=? AND personId=?) AS t '.
            'JOIN Events ON Events.id=t.eventId '.
            'ORDER BY Events.rank',
            array($defaultCompetition,$personId)
        );
        if (!count($result)) error('Competition without events (!?)');
        $defaultEvent = $result[0]['id'];
        $return['events'] = $result;
    } else {
        $defaultEvent = $eventId;
    }
    //
    if (!$roundId) {
        $result = pdo_query(
            'SELECT Rounds.id, Rounds.name FROM '.
            '(SELECT DISTINCT roundId FROM Results WHERE competitionId=? AND eventId=? AND personId=?) AS t '.
            'JOIN Rounds ON Rounds.id=t.roundId '.
            'ORDER BY Rounds.rank',
            array($defaultCompetition,$defaultEvent,$personId)
        );
        if (!count($result)) error('Event without rounds (!?)');
        $defaultRound = $result[0]['id'];
        $return['rounds'] = $result;
    } else {
        $defaultRound = $roundId;
    }
    //
    $result = pdo_query(
        'SELECT Results.*, format, Formats.name AS roundFormatName FROM Results '.
        'JOIN Events ON Events.id=Results.eventId '.
        'JOIN Formats ON Formats.id=Results.formatId '.
        'WHERE competitionId=? AND eventId=? AND personId=? AND roundId=?',
        array($defaultCompetition,$defaultEvent,$personId,$defaultRound)
    );
    if (!count($result)) error('No results for this competition, competitor, event and round (!?)');
    $return['resultId'] = $result[0]['id'];
    $return['resultsFormat'] = $result[0]['format'];
    $return['roundFormat'] = $result[0]['formatId'];
    $return['roundFormatName'] = $result[0]['roundFormatName'];
    $return['results'] = array(
        $result[0]['value1'],
        $result[0]['value2'],
        $result[0]['value3'],
        $result[0]['value4'],
        $result[0]['value5'],
        $result[0]['best'],
        $result[0]['average'],
        $result[0]['regionalSingleRecord'],
        $result[0]['regionalAverageRecord']
    );
    //
    echo json_encode($return);
}
