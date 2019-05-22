<?php

$jQuery = 1;
$currentSection = 'admin';
require('../includes/_header.php');

// set session key if not set already
if(!isset($_SESSION['anticsrf_key'])) {
    $_SESSION['anticsrf_key'] = sha1(microtime());
}
?>
<form>
    <table class="prereg">
        <tr>
            <td><label for="personId">Person Id</label></td>
            <td>
                <input type="text" id="personId" required autofocus autocomplete="off" placeholder="Enter Person ID..." pattern="(19|20)\d{2}([a-z]|[A-Z]){4}\d{2}" style="text-transform: uppercase;" oninput="personIdChange(this.value);" />
                <div id="personName" class="fix_results_person_name"></div>
            </td>
        </tr>
        <tr>
            <td><label for="competitions">Competitions</label></td>
            <td style="width:400px;"><select id="competitions" onchange="competitionIdChange(this.value);"></select></td>
        </tr>
        <tr>
            <td><label for="events">Events</label></td>
            <td><select id="events" onchange="eventIdChange(this.value);"></select></td>
        </tr>
        <tr>
            <td><label for="rounds">Rounds</label></td>
            <td><select id="rounds" onchange="roundTypeIdChange(this.value);"></select></td>
        </tr>
        <tr>
            <td style="width:130px;"><div id="roundFormat" style="font-size: 11px; text-align: right;"></div><div id="samples" style="font-size: 11px; text-align: right;"></div></td>
            <td>
                <table id="resultsTable" width="100%">
                    <tr><td class="text-right"><label for="value1">value1</label></td><td><input id="value1" type="text" autocomplete="off" onblur="blurResult(this);" onkeyup="checkResults();" style="text-transform: uppercase;" /></td></tr>
                    <tr><td class="text-right"><label for="value2">value2</label></td><td><input id="value2" type="text" autocomplete="off" onblur="blurResult(this);" onkeyup="checkResults();" style="text-transform: uppercase;" /></td></tr>
                    <tr><td class="text-right"><label for="value3">value3</label></td><td><input id="value3" type="text" autocomplete="off" onblur="blurResult(this);" onkeyup="checkResults();" style="text-transform: uppercase;" /></td></tr>
                    <tr><td class="text-right"><label for="value4">value4</label></td><td><input id="value4" type="text" autocomplete="off" onblur="blurResult(this);" onkeyup="checkResults();" style="text-transform: uppercase;" /></td></tr>
                    <tr><td class="text-right"><label for="value5">value5</label></td><td><input id="value5" type="text" autocomplete="off" onblur="blurResult(this);" onkeyup="checkResults();" style="text-transform: uppercase;" /></td></tr>
                    <tr><td class="text-right"><label for="best">best</label></td><td><input id="best" type="text" style="text-transform: uppercase" readonly disabled /></td></tr>
                    <tr><td class="text-right"><label for="average" id="labelAverage"></label></td><td><input id="average" type="text" style="text-transform: uppercase" readonly disabled /></td></tr>
                    <tr><td class="text-right"><label for="regionalSingleRecord">regional single record</label></td><td><input id="regionalSingleRecord" type="text" autocomplete="off" onkeyup="checkResults();" /></td></tr>
                    <tr><td class="text-right"><label for="regionalAverageRecord">regional average record</label></td><td><input id="regionalAverageRecord" type="text" autocomplete="off" onkeyup="checkResults();" /></td></tr>
                </table>
            </td>
        </tr>
        <tr>
            <td></td>
            <td style='text-align:center'><input type='button' id='saveBtn' value='save changes' onclick="fixResults();" disabled style='font-weight:bold' /> </td>
        </tr>
    </table>
</form>

<p>After fixing your results, you must run these scripts to ensure that the changes are sound.</p>
<ol>
    <li><a id="check-results" href="#" target="_blank">Check results</a> (needed once for each round to fix rankings and to check for consistency)</li>
    <li><a id="check-rounds" href="#" target="_blank">Check rounds</a> (only needed if the round type was changed, e.g. "Final" &lt;-&gt; "Combined Final")</li>
    <li><a id="compute-aux-data" href="#" target="_blank">Compute auxiliary data</a> (only needed if best or average were affected and only once in the end when fixing multiple results)</li>
</ol>

<script>

var
    lastPersonId,
    lastCompetitionId,
    lastEventId,
    lastRoundId,

    resultId,

    resultsFormat,
    TIME_FORMAT = 'time',
    FM_FORMAT = 'number',
    MULTI_FORMAT = 'multi',

    roundFormat,
    FORMAT_AVERAGE = 'a',
    FORMAT_MEAN = 'm',

    COLOR_ERROR = '#f88',
    COLOR_NORMAL = '#eef',
    COLOR_CHANGE = '#9f3',
    EDITABLE_FIELD_BG_COLOR = '#ff9',
    DISABLED_FIELD_BG_COLOR = '#ccc',

    WCA_DNF = -1,
    WCA_DNS = -2,

    patterns = {
        time: '^(|DNF|DNS|(60|[1-5][0-9]|[1-9]):[0-5][0-9]\\.[0-9]{2}|[1-5]?[0-9]\\.[0-9]{2})$',
        number: '^(|DNF|DNS|(80|[1-7][0-9]))$',
        multi: '^(|DNF|DNS|([1-9][0-9]|[2-9])\\/([1-9][0-9]|[2-9])\\s(60|[1-5][0-9]|[1-9]):[0-5][0-9])$'
    },
    patternRegionalRecords = '^(|WR|AfR|AsR|OcR|ER|NAR|SAR|NR)$',
    validFormatSamples = {
        time: '1:23.45<br>1.23<br>0.89<br>DNF<br>DNS',
        number: '35<br>DNF<br>DNS',
        multi: '2/3 9:34<br>10/12 59:87<br>DNF<br>DNS'
    },

    resultsInputs = {},
    actualResults = {},
    MAX_SOLVE_COUNT = 5,
    SOLVE_FIELDS = [ 'value1', 'value2', 'value3', 'value4', 'value5', 'best', 'average', 'regionalSingleRecord', 'regionalAverageRecord' ],
    ROUND_FORMAT_TO_EDITABLE_FIELDS = {
        "1": [ 'value1', 'regionalSingleRecord' ],
        "2": [ 'value1', 'value2', 'regionalSingleRecord' ],
        "3": [ 'value1', 'value2', 'value3', 'regionalSingleRecord' ],
        "a": [ 'value1', 'value2', 'value3', 'value4', 'value5', 'regionalSingleRecord', 'regionalAverageRecord' ],
        "m": [ 'value1', 'value2', 'value3', 'regionalSingleRecord', 'regionalAverageRecord' ],
    },
    ROUND_FORMAT_TO_NUMBER_OF_ATTEMPTS = {
        "1": 1,
        "2": 2,
        "3": 3,
        "a": 5,
        "m": 3
    };



function clearResults()
{
    $('#resultsTable').find('input').val('').attr('readonly', true).prop('disabled', true).css('background-color', DISABLED_FIELD_BG_COLOR)
        .parent().css('background-color', COLOR_NORMAL);
    $('input:button').css('background-color', COLOR_ERROR).prop('disabled', true);
    $('#samples').text('');
    $('#roundFormat').text('');
}

function clearRounds()
{
    $('#rounds').find('option').remove();
    lastRoundId = null;
    clearResults();
}

function clearEvents()
{
    $('#events').find('option').remove();
    lastEventId = null;
    clearRounds();
}

function clearCompetitions()
{
    $('#competitions').find('option').remove();
    lastCompetitionId = null;
    clearEvents();
}

function clearPerson()
{
    $('#personName').text('');
    lastPersonId = null;
    clearCompetitions();
}

function extractEvents(obj)
{
    var selectEvents = $('#events');
    lastEventId = obj.events[0].id;
    for(var i=0;i<obj.events.length;i++) {
        $("<option>", {value: obj.events[i].id, text: obj.events[i].name}).appendTo(selectEvents);
    }
}

function extractRounds(obj)
{
    var selectRounds = $('#rounds');
    lastRoundId = obj.rounds[0].id;
    for(var i=0;i<obj.rounds.length;i++) {
        $("<option>", {value: obj.rounds[i].id, text: obj.rounds[i].name}).appendTo(selectRounds);
    }
}

function extractResults(obj)
{
    resultId = obj.resultId;
    setResultsFormat(obj.resultsFormat);
    setRoundFormat(obj.roundFormat, obj.roundFormatName);

    actualResults = obj.results;
    SOLVE_FIELDS.forEach(function(field) {
        var isRecordField = field === "regionalSingleRecord" || field === "regionalAverageRecord";
        if (isRecordField && actualResults[field]===null) { // some records comes as null
            actualResults[field] = '';
        }
        var $input = resultsInputs[field];
        if(isRecordField) {
            $input.val(actualResults[field]);
        } else {
            $input.val(wcaResultToString(actualResults[field]));
        }

        var editableFields = ROUND_FORMAT_TO_EDITABLE_FIELDS[roundFormat];
        if(editableFields.indexOf(field) >= 0) {
            var pattern = isRecordField ? patternRegionalRecords : patterns[resultsFormat];
            $input.attr({readonly: false, pattern: pattern}).prop('disabled', false).css('background-color', EDITABLE_FIELD_BG_COLOR);
        }
    });
}

function personIdChange(newPersonId)
{
    newPersonId = newPersonId.toUpperCase();
    if (newPersonId != lastPersonId) {
        clearPerson();
        lastPersonId = newPersonId;
        somethingChanged();
        if (/^(19|20)\d{2}([A-Z]){4}\d{2}$/.test(newPersonId)) {
            $.get('scripts/fixresults_ajax.php', {
                token: '<?=$_SESSION['anticsrf_key']?>',
                personId: newPersonId
            }
            ).done(function(data) {
                var obj = $.parseJSON(data);
                if (obj.error) {
                    if (obj.error.show) {
                        alert(obj.error.msg);
                    } else {
                        $('#personName').text('*** not found ***');
                    }
                } else {
                    $('#personName').text(obj.personName);
                    var selectCompetitions = $('#competitions');
                    lastCompetitionId = obj.competitions[0].id;
                    for(var i=0;i<obj.competitions.length;i++) {
                        $("<option>", {value: obj.competitions[i].id, text: obj.competitions[i].name}).appendTo(selectCompetitions);
                    }
                    extractEvents(obj);
                    extractRounds(obj);
                    extractResults(obj);
                }
                somethingChanged();
            });
        }
    }
}

function competitionIdChange(newCompetitionId)
{
    if (newCompetitionId != lastCompetitionId) {
        clearEvents();
        lastCompetitionId = newCompetitionId;
        somethingChanged();
        $.get('scripts/fixresults_ajax.php',
            {
                token: '<?=$_SESSION['anticsrf_key']?>',
                personId: lastPersonId,
                competitionId: newCompetitionId
            }
        ).done(function(data) {
            var obj = $.parseJSON(data);
            if (obj.error) {
                alert(obj.error.msg);
            } else {
                extractEvents(obj);
                extractRounds(obj);
                extractResults(obj);
            }
            somethingChanged();
        });
    }
}

function eventIdChange(newEventId)
{
    if (newEventId != lastEventId) {
        clearRounds();
        lastEventId = newEventId;
        somethingChanged();
        $.get('scripts/fixresults_ajax.php',
            {
                token: '<?=$_SESSION['anticsrf_key']?>',
                personId: lastPersonId,
                competitionId: lastCompetitionId,
                eventId: newEventId
            }
        ).done(function(data) {
            var obj = $.parseJSON(data);
            if (obj.error) {
                alert(obj.error.msg);
            } else {
                extractRounds(obj);
                extractResults(obj);
            }
            somethingChanged();
        });
    }
}

function roundTypeIdChange(newRoundId)
{
    if (newRoundId != lastRoundId) {
        clearResults();
        lastRoundId = newRoundId;
        somethingChanged();
        $.get('scripts/fixresults_ajax.php',
            {
                token: '<?=$_SESSION['anticsrf_key']?>',
                personId: lastPersonId,
                competitionId: lastCompetitionId,
                eventId: lastEventId,
                roundTypeId: newRoundId
            }
        ).done(function(data) {
            var obj = $.parseJSON(data);
            if (obj.error) {
                alert(obj.error.msg);
            } else {
                extractResults(obj);
            }
            somethingChanged();
        });
    }
}

function somethingChanged()
{
  if(!lastCompetitionId || !lastEventId) {
    $('#check-results').attr("href", "check_results.php");
    $('#check-rounds').attr("href", "check_rounds.php");
    $('#compute-aux-data').attr("href", "/admin/compute_auxiliary_data");
  } else {
    var params = {
      competitionId: lastCompetitionId,
      eventId: lastEventId,
      show: "Show",
    };
    $('#check-results').attr("href", "check_results.php?" + $.param(params));
    var params = {
      competitionId: lastCompetitionId,
      show: "Show",
    };
    $('#check-rounds').attr("href", "check_rounds.php?" + $.param(params));
    $('#compute-aux-data').attr("href", "/admin/do_compute_auxiliary_data");
  }
}

function setResultsFormat(formatStr)
{
    resultsFormat = formatStr;
    $('#samples').html('<p>Valid format samples:<div style="color:#510000;">'+validFormatSamples[resultsFormat]+'</div></p>');
}

function setRoundFormat(formatChr, formatName)
{
    /* 333bf is actually a best of 3, but it's better to think of it as a mean of 3,
       since it does contain an average and we are only looking at a single result */
    roundFormat = (lastEventId=='333bf' || lastEventId=='444bf' || lastEventId=='555bf') && formatChr=='3' ? FORMAT_MEAN : formatChr;
    $('#roundFormat').html('<p>Round format:<div style="color:#510000;">'+formatName+'</div></p>');
    $('#labelAverage').text(roundFormat < FORMAT_AVERAGE ? '' : (roundFormat == FORMAT_MEAN ? 'mean' : 'average'));
}

function wcaResultToString(result)
{
    if (result==0) {
        return '';
    } else if (result==WCA_DNF) {
        return 'DNF';
    } else if (result==WCA_DNS) {
        return 'DNS';
    } else {
        switch (resultsFormat) {
            case TIME_FORMAT:
                var hh = result % 100;
                var hhStr = hh+'';
                if (hhStr.length < 2) hhStr = '0'+hhStr;
                result = Math.floor(result / 100);
                var ss = result % 60;
                var mm = Math.floor(result / 60);
                if (mm) {
                    var ssStr = ss+'';
                    if (ssStr.length < 2) ssStr = '0'+ssStr;
                    return mm+':'+ssStr+'.'+hhStr;
                } else {
                    return ss+'.'+hhStr;
                }
            case FM_FORMAT:
                return result+'';
            case MULTI_FORMAT:
                var MM = result % 100;
                result = Math.floor(result / 100);
                var TTTTT = result % 100000;
                result = Math.floor(result / 100000);
                var DD = result;
                var points = 99 - DD;
                var attempted = points + MM * 2;
                var solved = attempted - MM;
                var ss = TTTTT % 60;
                var ssStr = ss+'';
                if (ssStr.length < 2) ssStr = '0'+ssStr;
                var mm = Math.floor(TTTTT / 60);
                return solved+'/'+attempted+' '+mm+':'+ssStr;
            default:
                throw new Error('Unsupported results format!');
        }
    }
}

function stringToWcaResult(result, isAverage)
{
    result = result.trim().toUpperCase();
    var pattern = new RegExp(isAverage && lastEventId == '333fm' ? '^(|DNF|DNS|(80|[1-7][0-9])(00|33|67))$' : patterns[resultsFormat]);
    if (!pattern.test(result)) {
        result = '';
    }
    if (result=='') {
        return 0;
    } else if (result=='DNF') {
        return WCA_DNF;
    } else if (result=='DNS') {
        return WCA_DNS;
    } else {
        switch (resultsFormat) {
            case TIME_FORMAT:
                var len = result.length;
                if (len > 5) {
                    var hh = parseInt(result.substr(len-2), 10);
                    var ss = parseInt(result.substr(len-5, 2), 10);
                    var mm = parseInt(result.substr(0, len-6), 10);
                    return ((mm*60)+ss)*100+hh;
                } else {
                    var hh = parseInt(result.substr(len-2), 10);
                    var ss = parseInt(result.substr(0, len-3), 10);
                    return ss*100+hh;
                }
            case FM_FORMAT:
                return parseInt(result, 10);
            case MULTI_FORMAT:
                var slashPosition = result.indexOf('/');
                var blankPosition = result.indexOf(' ');
                var solved = parseInt(result.substr(0, slashPosition), 10);
                var attempted = parseInt(result.substr(slashPosition+1, blankPosition-slashPosition-1), 10);
                if (solved > attempted) return 0;
                var ss = parseInt(result.substr(result.length-2), 10);
                var mm = parseInt(result.substr(blankPosition+1, result.length-blankPosition-4), 10);
                return ((99-solved*2+attempted)*100000 + mm*60+ss)*100 + (attempted-solved);
            default:
                throw new Error('Unsupported results format!');
        }
    }
}

function blurResult(element)
{
    element.value = wcaResultToString(stringToWcaResult(element.value));
}

function checkResults()
{
    var results = [];
    var result;
    var errors = false;
    var changes = false;
    var sum = 0;
    var best = Infinity;
    var worst = 0;
    var countDnfOrDns = 0;
    var countBlanks = 0;
    var average;
    for (var i = 1; i <= ROUND_FORMAT_TO_NUMBER_OF_ATTEMPTS[roundFormat]; i++) {
        var field = "value" + i;
        result = stringToWcaResult(resultsInputs[field].val());
        if (result > 0) {
            sum += result;
            if (result < best) best = result;
            if (result > worst) worst = result;
        } else if (result < 0) {
            countDnfOrDns++;
        } else {
            countBlanks++;
        }
        if (!result && resultsInputs[field].val()) {
            resultsInputs[field].parent().css('background-color', COLOR_ERROR);
            errors = true;
        } else {
            if (result == actualResults[field]) {
                resultsInputs[field].parent().css('background-color', COLOR_NORMAL);
            } else {
                changes = true;
                resultsInputs[field].parent().css('background-color', COLOR_CHANGE);
            }
        }
        results[field] = result;
    }
    if (errors) {
        best = 0;
        average = 0;
        resultsInputs.best.parent().css('background-color', COLOR_NORMAL);
        resultsInputs.average.parent().css('background-color', COLOR_NORMAL);
    } else {
        if (!worst) {
            if (countDnfOrDns > 0) {
                best = WCA_DNF;
                if (roundFormat < FORMAT_AVERAGE) { // Best of X
                    average = 0;
                } else {
                    average = countBlanks ? 0 : WCA_DNF;
                }
            } else {
                best = 0;
                average = 0;
            }
        } else {
            if (roundFormat < FORMAT_AVERAGE || countBlanks) { // Best of X or there are blanks
                average = 0;
            } else if (countDnfOrDns > 1) {
                average = WCA_DNF;
            } else if (roundFormat > FORMAT_AVERAGE) { // Mean of 3
                if (countDnfOrDns > 0) {
                    average = WCA_DNF;
                } else if (lastEventId=='333fm') {
                    average = Math.round(sum*100/3);
                } else {
                    average = Math.round(sum/3);
                }
            } else { // Average of 5
                if (countDnfOrDns > 0) {
                    average = Math.round((sum - best) / 3);
                } else {
                    average = Math.round((sum - best - worst) / 3);
                }
            }
        }
        resultsInputs.best.parent().css('background-color', best == actualResults.best ? COLOR_NORMAL : COLOR_CHANGE);
        resultsInputs.average.parent().css('background-color', roundFormat < FORMAT_AVERAGE || average == actualResults.average ? COLOR_NORMAL : COLOR_CHANGE);
    }
    resultsInputs.best.val(wcaResultToString(best));
    resultsInputs.average.val(wcaResultToString(average));

    var pattern = new RegExp(patternRegionalRecords);
    ['regionalSingleRecord', 'regionalAverageRecord'].forEach(function(field) {
        if (!pattern.test(resultsInputs[field].val())) {
            errors = true;
            resultsInputs[field].parent().css('background-color', COLOR_ERROR);
        } else {
            if (resultsInputs[field].val() == actualResults[field]) {
                resultsInputs[field].parent().css('background-color', COLOR_NORMAL);
            } else {
                changes = true;
                resultsInputs[field].parent().css('background-color', COLOR_CHANGE);
            }
        }

    });

    if (!errors) {
        // check that there are no gaps in the results
        var firstBlank = 0;
        while (firstBlank < MAX_SOLVE_COUNT && results['value' + (firstBlank+1)]) {
            firstBlank++;
        }
        var lastBlank = MAX_SOLVE_COUNT - 1;
        while (lastBlank >= 0 && !results['value' + (lastBlank+1)]) {
            lastBlank--;
        }
        errors = ( firstBlank == 0 || firstBlank <= lastBlank );
    }

    var submitEnabled = !errors && changes;
    $('input:button').css('background-color', submitEnabled?COLOR_CHANGE:COLOR_ERROR).prop('disabled', !submitEnabled);
}

function fixResults()
{
    $.get('scripts/fixresults_ajax.php',
        {
            token: '<?=$_SESSION['anticsrf_key']?>',
            fix: 1,
            resultId: resultId,
            personId: lastPersonId,
            competitionId: lastCompetitionId,
            eventId: lastEventId,
            roundTypeId: lastRoundId,
            value1: stringToWcaResult(resultsInputs.value1.val()),
            value2: stringToWcaResult(resultsInputs.value2.val()),
            value3: stringToWcaResult(resultsInputs.value3.val()),
            value4: stringToWcaResult(resultsInputs.value4.val()),
            value5: stringToWcaResult(resultsInputs.value5.val()),
            best: stringToWcaResult(resultsInputs.best.val()),
            average: stringToWcaResult(resultsInputs.average.val(), true),
            regionalSingleRecord: resultsInputs.regionalSingleRecord.val(),
            regionalAverageRecord: resultsInputs.regionalAverageRecord.val()
        }
    ).done(function(data) {
        var obj = $.parseJSON(data);
        if (obj.error) {
            alert(obj.error.msg);
        } else {
            var aux = lastRoundId;
            lastRoundId = null;
            roundTypeIdChange(aux);
            if (!obj.success) {
                alert('OOOPS, there was an error trying to update those results');
            }
        }
    });
}

$(document).ready(function () {
    SOLVE_FIELDS.forEach(function(field) {
        resultsInputs[field] = $('#' + field);
    });
    clearResults();
    somethingChanged();
});

</script>

<?php require( '../includes/_footer.php' );
