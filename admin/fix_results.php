<?php

$jQuery = 1;
$currentSection = 'admin';
require('../includes/_header.php');
?>
<form>
    <table class="prereg">
        <tr>
            <td><label for="personId">Person Id</label></td>
            <td>
                <input type="text" id="personId" required autofocus autocomplete="off" placeholder="Enter Person ID..." pattern="(19|20)\d{2}([a-z]|[A-Z]){4}\d{2}" style="text-transform: uppercase;" onkeyup="personIdChange(this.value);" />
                <div id="competitorName">&nbsp;</div>
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
            <td><select id="rounds" onchange="roundIdChange(this.value);"></select></td>
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
                    <tr><td class="text-right"><label for="value6">best</label></td><td><input id="value6" type="text" style="text-transform: uppercase;background-color: #cccccc" readonly disabled /></td></tr>
                    <tr><td class="text-right"><label for="value7" id="labelAverage"></label></td><td><input id="value7" type="text" style="text-transform: uppercase;background-color: #cccccc" readonly disabled /></td></tr>
                    <tr><td class="text-right"><label for="value8">regional single record</label></td><td><input id="value8" type="text" autocomplete="off" onkeyup="checkResults();" /></td></tr>
                    <tr><td class="text-right"><label for="value9">regional average record</label></td><td><input id="value9" type="text" autocomplete="off" onkeyup="checkResults();" /></td></tr>
                </table>
            </td>
        </tr>
        <tr>
            <td></td>
            <td style='text-align:center'><input type='button' id='saveBtn' value='save changes' onclick="fixResults();" disabled style='background-color:#9F3;font-weight:bold' /> </td>
        </tr>
    </table>
</form>

<p>After fixing your results, you must run these scripts to ensure that the changes are sound. Just once after several fixes is fine:</p>
<!-- todo: some links to useful scripts are placed here.  Check that the URLs are correct and add any of your election.  -->
<ol>
    <li><a href="check_results.php?which=recent&what=individual&go=Go" target="_blank">Check recent individual results</a></li>
    <li><a href="check_results.php?which=recent&what=ranks&go=Go" target="_blank">Check recent ranks</a>.
        (If the ranks change this will fix them and you'll be warned.)</li>
    <li><a href="compute_auxiliary_data.php?doit=+Do+it+now+" target="_blank">Compute auxiliary data</a></li>
</ol>

<script>

var
    lastPersonId,
    lastCompetitionId,
    lastEventId,
    lastRoundId,

    resultId,

    resultsFormat,
    TIME_FORMAT = 0,
    FM_FORMAT = 1,
    MULTI_FORMAT = 2,

    roundFormat,
    FORMAT_AVERAGE = 'a',
    FORMAT_MEAN = 'm';

    patterns = [
        '^(|DNF|DNS|(60|[1-5][0-9]|[1-9]):[0-5][0-9]\\.[0-9]{2}|[1-5]?[0-9]\\.[0-9]{2})$',
        '^(|DNF|DNS|(80|[1-7][0-9]))$',
        '^(|DNF|DNS|([1-9][0-9]|[2-9])\\/([1-9][0-9]|[2-9])\\s(60|[1-5][0-9]|[1-9]):[0-5][0-9])$'
    ],
    patternRegionalRecords = '^(|WR|AfR|AsR|OcR|ER|NAR|SAR|NR)$',
    validFormatSamples = [
        '1:23.45<br>1.23<br>0.89<br>DNF<br>DNS',
        '35<br>DNF<br>DNS',
        '2/3 9:34<br>10/12 59:87<br>DNF<br>DNS'
    ],

    actualResults = [];

function clearResults()
{
    $('#resultsTable').find('input').val('').attr('readonly',true).prop('disabled',true).css('background-color','#ccc')
        .parent().css('background-color','#eef');
    $('input:button').css('background-color','#f88').prop('disabled',true);
    $('#samples').html('');
    $('#roundFormat').html('');
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
    $('#competitorName').html('&nbsp;');
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
    setRoundFormat(obj.roundFormat,obj.roundFormatName);
    var input;
    var topResults = 5;
    for (var i=1;i<=9;i++) {
        actualResults[i-1] = obj.results[i-1];
        if (i < 8) {
            input = $('#value'+i).val(decodeResult(obj.results[i-1]));
        } else {
            input = $('#value'+i).val(obj.results[i-1]);
        }

        if (roundFormat < FORMAT_AVERAGE) {
            topResults = parseInt(roundFormat,10);
        } else if (roundFormat == FORMAT_MEAN) {
            topResults = 3;
        }
        if (i<=topResults) {
            $(input).attr({readonly: false, pattern: patterns[resultsFormat]}).prop('disabled',false).css('background-color','#ff9');
        } else if (i>7) {
            $(input).attr({readonly: false, pattern: patternRegionalRecords}).prop('disabled',false).css('background-color','#ff9');
        }
    }
}

function personIdChange(v)
{
    v = v.toUpperCase();
    if (v != lastPersonId) {
        clearPerson();
        lastPersonId = v;
        if (/^(19|20)\d{2}([A-Z]){4}\d{2}$/.test(v)) {
            $.ajax('scripts/fixresults_ajax.php?personId='+v).done(function(data) {
                var obj = $.parseJSON(data);
                if (obj.error) {
                    if (obj.error.show) {
                        alert(obj.error.msg);
                    } else {
                        $('#competitorName').html('*** not found ***');
                    }
                } else {
                    $('#competitorName').html(obj.competitorName);
                    var selectCompetitions = $('#competitions');
                    lastCompetitionId = obj.competitions[0].id;
                    for(var i=0;i<obj.competitions.length;i++) {
                        $("<option>", {value: obj.competitions[i].id, text: obj.competitions[i].name}).appendTo(selectCompetitions);
                    }
                    extractEvents(obj);
                    extractRounds(obj);
                    extractResults(obj);
                }
            });
        }
    }
}

function competitionIdChange(v)
{
    if (v != lastCompetitionId) {
        clearEvents();
        lastCompetitionId = v;
        $.ajax('scripts/fixresults_ajax.php?personId='+$('#personId').val().toUpperCase()+'&competitionId='+v).done(function(data) {
            var obj = $.parseJSON(data);
            if (obj.error) {
                alert(obj.error.msg);
            } else {
                extractEvents(obj);
                extractRounds(obj);
                extractResults(obj);
            }
        });
    }
}

function eventIdChange(v)
{
    if (v != lastEventId) {
        clearRounds();
        lastEventId = v;
        $.ajax('scripts/fixresults_ajax.php?personId='+$('#personId').val().toUpperCase()+'&competitionId='+$('#competitions').val()+'&eventId='+v).done(function(data) {
            var obj = $.parseJSON(data);
            if (obj.error) {
                alert(obj.error.msg);
            } else {
                extractRounds(obj);
                extractResults(obj);
            }
        });
    }
}

function roundIdChange(v)
{
    if (v != lastRoundId) {
        clearResults();
        lastRoundId = v;
        $.ajax('scripts/fixresults_ajax.php?personId='+$('#personId').val().toUpperCase()+'&competitionId='+$('#competitions').val()+
                '&eventId='+$('#events').val()+'&roundId='+v).done(function(data) {
            var obj = $.parseJSON(data);
            if (obj.error) {
                alert(obj.error.msg);
            } else {
                extractResults(obj);
            }
        });
    }
}

function setResultsFormat(formatStr)
{
    if (formatStr=='time') {
        resultsFormat = TIME_FORMAT;
    } else if (formatStr=='number') {
        resultsFormat = FM_FORMAT;
    } else {
        resultsFormat = MULTI_FORMAT;
    }
    $('#samples').html('<p>Valid format samples:<div style="color:#510000;">'+validFormatSamples[resultsFormat]+'</div></p>');
}

function setRoundFormat(formatChr,formatName)
{
    roundFormat = $('#events').val()=='333bf' && formatChr=='3' ? FORMAT_MEAN : formatChr;
    $('#roundFormat').html('<p>Round format:<div style="color:#510000;">'+formatName+'</div></p>');
    $('#labelAverage').html(roundFormat < FORMAT_AVERAGE ? '' : (roundFormat == FORMAT_MEAN ? 'mean' : 'average'));
}

function decodeResult(result)
{
    if (result==0) {
        return '';
    } else if (result==-1) {
        return 'DNF';
    } else if (result==-2) {
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
                break;
            case FM_FORMAT:
                return result+'';
                break;
            default: // MULTI_FORMAT
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
        }
    }
}

function encodeResult(result)
{
    result = result.trim().toUpperCase();
    pattern = new RegExp(patterns[resultsFormat]);
    if (!pattern.test(result)) {
        result = '';
    }
    if (result=='') {
        return 0;
    } else if (result=='DNF') {
        return -1;
    } else if (result=='DNS') {
        return -2;
    } else {
        switch (resultsFormat) {
            case TIME_FORMAT:
                var len = result.length;
                if (len > 5) {
                    var hh = parseInt(result.substr(len-2),10);
                    var ss = parseInt(result.substr(len-5,2),10);
                    var mm = parseInt(result.substr(0,len-6),10);
                    return ((mm*60)+ss)*100+hh;
                } else {
                    var hh = parseInt(result.substr(len-2),10);
                    var ss = parseInt(result.substr(0,len-3),10);
                    return ss*100+hh;
                }
                break;
            case FM_FORMAT:
                return parseInt(result,10);
                break;
            default: // MULTI_FORMAT
                var p1 = result.indexOf('/');
                var p2 = result.indexOf(' ');
                var solved = parseInt(result.substr(0,p1),10);
                var attempted = parseInt(result.substr(p1+1,p2-p1-1),10);
                if (solved > attempted) return 0;
                var ss = parseInt(result.substr(result.length-2),10);
                var mm = parseInt(result.substr(p2+1,result.length-p2-4),10);
                return ((99-solved*2+attempted)*100000 + mm*60+ss)*100 + (attempted-solved);
        }
    }
}

function blurResult(element)
{
    element.value = decodeResult(encodeResult(element.value));
}

function checkResults()
{
    var results = [];
    var result, input;
    var errors = false;
    var changes = false;
    var sum = 0;
    var best = 9999999999;
    var worst = 0;
    var dnfs = 0;
    var average;
    for (var i=1;i<=5;i++) {
        input = $('#value'+i);
        result = encodeResult(input.val());
        if (result > 0) {
            sum += result;
            if (result < best) best = result;
            if (result > worst) worst = result;
        } else if (result < 0) {
            dnfs++;
        }
        if (!result && $(input).val()) {
            $(input).parent().css('background-color','#f88');
            errors = true;
        } else {
            if (result == actualResults[i-1]) {
                $(input).parent().css('background-color','#eef');
            } else {
                changes = true;
                $(input).parent().css('background-color','#9f3');
            }
        }
        results[i-1] = result;
    }
    if (errors) {
        best = 0;
        average = 0;
        $('#value6').parent().css('background-color','#eef');
        $('#value7').parent().css('background-color','#eef');
    } else {
        if (!worst) {
            if (dnfs) {
                best = -1;
                average = -1;
            } else {
                best = 0;
                average = 0;
            }
        } else {
            if (roundFormat < FORMAT_AVERAGE) { // Best of X
                average = 0;
            } else if (dnfs > 1) {
                average = -1;
            } else if (roundFormat > FORMAT_AVERAGE) { // Mean of 3
                if (dnfs) {
                    average = -1;
                } else if ($('#events').val()=='333fm') {
                    average = Math.round(sum*100/3);
                } else {
                    average = Math.round(sum/3);
                }
            } else { // Average of 5
                if (dnfs) {
                    average = Math.round((sum - best) / 3);
                } else {
                    average = Math.round((sum - best - worst) / 3);
                }
            }
        }
        $('#value6').parent().css('background-color',best == actualResults[5] ? '#eef' : '#9f3');
        $('#value7').parent().css('background-color',roundFormat < FORMAT_AVERAGE || average == actualResults[6] ? '#eef' : '#9f3');
    }
    $('#value6').val(decodeResult(best));
    $('#value7').val(decodeResult(roundFormat < FORMAT_AVERAGE ? 0 : average));
    //
    var pattern, b;
    pattern = new RegExp(patternRegionalRecords);
    for (i=8;i<10;i++) {
        input = $('#value'+i);
        b = pattern.test($(input).val());
        if (!b) {
            errors = true;
            $(input).parent().css('background-color','#f88');
        } else {
            if ($(input).val() == actualResults[i-1]) {
                $(input).parent().css('background-color','#eef');
            } else {
                changes = true;
                $(input).parent().css('background-color','#9f3');
            }
        }
    }
    //
    if (!errors) {
        var p1 = 0;
        while (p1 < 5 && results[p1]) p1++;
        var p2 = 4;
        while (p2 >= 0 && !results[p2]) p2--;
        if (!p1 || p1 <= p2) errors = true;
    }
    //
    b = !errors && changes;
    $('input:button').css('background-color',b?'#9f3':'#f88').prop('disabled',!b);
}

function fixResults()
{
    var url = 'scripts/fixresults_ajax.php?fix=1&resultId='+resultId+'&personId='+$('#personId').val().toUpperCase()+'&competitionId='+$('#competitions').val()+
        '&eventId='+$('#events').val()+'&roundId='+$('#rounds').val();
    for (var i=1;i<6;i++) {
        url += '&value'+i+'='+encodeResult($('#value'+i).val());
    }
    url += '&best='+encodeResult($('#value6').val());
    if (resultsFormat==FM_FORMAT) { // trick for FM mean
        patterns[FM_FORMAT] = '^(|DNF|DNS|(80|[1-7][0-9])(00|33|67))$';
    }
    url += '&average='+encodeResult($('#value7').val());
    if (resultsFormat==FM_FORMAT) {
        patterns[FM_FORMAT] = '^(|DNF|DNS|(80|[1-7][0-9]))$';
    }
    url += '&regionalSingleRecord='+$('#value8').val();
    url += '&regionalAverageRecord='+$('#value9').val();
    $.ajax(url).done(function(data) {
        var obj = $.parseJSON(data);
        if (obj.error) {
            alert(obj.error.msg);
        } else {
            var aux = lastRoundId;
            lastRoundId = null;
            roundIdChange(aux);
            if (!obj.success) {
                alert('OOOPS, there was an error trying to update those results');
            }
        }
    });
}

$(document).ready(function () {
    clearResults();
});

</script>

<?php require( '../includes/_footer.php' );
