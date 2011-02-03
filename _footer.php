<? if( debug() ){ ?>
        <p style="text-align:right; color:#666">dbQuery(<?= $dbQueryCtr ?>) dbCommand(<?= $dbCommandCtr ?>)</p>
<? } ?>

<? stopTimer( "whole page generation" ) ?>

<? if( ! $standAlone ){ ?>
</div>
</div>
<? } ?>

</body>
</html>
<? finishCache() ?>