
// Offline caching.
var cache = window.applicationCache;
function updateReadyCache() {
  window.applicationCache.swapCache();
  location.reload(true); // For now
}

// Implementation of bind() for Safari.
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
                                 ? this
                                 : oThis || window,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

scramble = (function() {

	var version = "November 23, 2011";

	var eventsPerRow = 8;

	var usingWebWorkers = false;

	var events = {
		// Official WCA events as of November 24, 2011
		"sq1": {name: "Square-1", scrambler_file: "scramble_sq1.js", default_round: ["avg", 5], default_num_rounds: 1},
	}

	// Javascript object don't retain key order in all browsers.
	var eventOrder = [
		"sq1"
	];

	var workerGroups = [
		["sq1"]
	];

	var workers = {};

	var roundNames = {
		"avg": "Average of",
		"best": "Best of",
		"combined": "Combined Round of",
		"mean": "Mean of"
	}

	var initialize = function() {

		initializeRandomSource();
		document.getElementById("goButton").focus();

		initializeEventIDSelect("333");

		initializeWorkers();
	};

	var handleWorkerMessage = function(e) {
		switch(e.data.action) {
			case "initialized":
				console.log("Web worker initialized successfully: " + e.data.info);
			break;

			case "get_random_scramble_starting":
				startScramble(
					e.data.return_data.trID,
					e.data.event_id,
					e.data.return_data.num
				);
			break;

			case "console_log":
				console.log("[Web worker log]", e.data.data);
			break;

			case "console_error":
				console.log("[Web worker error]", e.data.data);
			break;

			case "message_exception":
				console.log("[Web worker exception]", e.data.data);
			break;

			case "initialize_benchmark_response":
				console.log("Benchmark initialized for worker " + e.data.worker_id + ".");
			break;

			case "get_random_scramble_initializing_scrambler":
				iniScramblerNotice(
					e.data.return_data.trID,
					e.data.event_id,
					e.data.return_data.num
				);
			break;

			case "get_random_scramble_response":
				//console.log("Received a " + events[e.data.event_id].name +	 " scramble: " + e.data.scramble.scramble);
				insertScramble(
					e.data.return_data.trID,
					e.data.event_id,
					e.data.return_data.num,
					e.data.scramble.scramble,
					e.data.scramble.state
				);
			break;

			case "echo_response":
				console.log("Echo response:");
				console.log(e.data);
			break;

			default:
				console.error("Unknown message. Action was: " + e.data.action);
			break;
		}
	}

	var initializeWorkers = function() {
		
		// From http://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers

		if (typeof Worker === "undefined") {
			console.log("No web worker support. :-(");
			return;
		}

		try {

			for (i in workerGroups) {

				var worker = new Worker("inc/web_worker_manager.js");
				var scramblerFiles = {};

				for (j in workerGroups[i]) {
					events[workerGroups[i][j]].worker = worker;
					scramblerFiles[workerGroups[i][j]] = "scramblers/" + events[workerGroups[i][j]].scrambler_file;
				}
				worker.onmessage = handleWorkerMessage;

				workers[i] = worker;

				worker.postMessage({action: "initialize", worker_id: i, event_ids: workerGroups[i], scrambler_files: scramblerFiles, random_seed: getRandomSeed()});
			}

			usingWebWorkers = true;

		}
		catch (e) {
			console.log("Starting the web workers failed. This happens with Chrome when run from file://");
			console.log("This was the web worker error:", e);
		}

	}

	var initializeEventIDSelect = function(defaultSelectedEvent) {

		//var eventIDSelect = document.getElementById("eventID");
		var selectSetsTable = document.getElementById("select_sets");
		var eventAmountsTable = document.getElementById("event_amounts");
		var currentEventAmountsTR;

		var numEvents = 0;
		for (i in eventOrder) {
			eventID = eventOrder[i]

			events[eventID].initialized = false;

			/*
			var newOption = createNewElement(eventIDSelect, "option", "", events[eventID].name);
			newOption.setAttribute("value", eventID);
			if (eventID == defaultSelectedEvent) {
				newOption.setAttribute("selected", "true");
			}
			*/

			var newTBody = createNewElement(selectSetsTable, "tbody");
			newTBody.setAttribute("id", "tbody_" + eventID);

			if (numEvents % eventsPerRow == 0) {
				currentEventAmountsTR = createNewElement(eventAmountsTable, "tr");
			}


			//createNewElement(currentEventAmountsTR, "td", "event_amount_id_td", eventID);
			var eventTD = createNewElement(currentEventAmountsTR, "td");
			var eventAddRoundButton = createNewElement(eventTD, "button", "addRoundButton", eventID);
			eventAddRoundButton.setAttribute("onclick", "scramble.addRound(\"" + eventID + "\");");

			/*

			var val = createNewElement(currentEventAmountsTR, "td", "event_amount_value_td", "");
			var valInput = createNewElement(val, "input", "event_amount_value");
				valInput.setAttribute("value", );
				valInput.setAttribute("id", "amount_value_" + eventID);
				valInput.setAttribute("type", "number");
				valInput.setAttribute("min", "0");
				valInput.setAttribute("onchange", "scramble.changeNumRounds(\"" + eventID + "\");");
				valInput.setAttribute("onkeyup", "scramble.changeNumRounds(\"" + eventID + "\");");
				valInput.setAttribute("onmouseup", "scramble.changeNumRounds(\"" + eventID + "\");");
				valInput.setAttribute("onclick", "scramble.changeNumRounds(\"" + eventID + "\");");

			*/

			for (var i = numCurrentRounds(eventID); i < events[eventID].default_num_rounds; i++) {
				addRound(eventID);
			}

			numEvents++;
		}
	}

	var numCurrentRounds = function(eventID) {
		return document.getElementsByClassName("event_tr_" + eventID).length;
	}

	var addRound = function(eventID, roundNameOpt) {

		var roundName = roundNameOpt;
		if (roundNameOpt === undefined) {
			roundName = "Round " + (numCurrentRounds(eventID)+1);
		}

		var eventTBody = document.getElementById("events_tbody");


		var newEventTR = createNewElement(eventTBody, "tr", "event_tr_" + eventID);
			newEventTR.setAttribute("data-event-id", eventID);

		var nameTD = createNewElement(newEventTR, "td", "event_name", events[eventID].name);
		
		var roundNameTD = createNewElement(newEventTR, "td");
		var roundNameInput = createNewElement(roundNameTD, "input", "round_name");
			roundNameInput.setAttribute("value", roundName);

		var roundTypeTD = createNewElement(newEventTR, "td");
		var roundTypeSelect = createNewElement(roundTypeTD, "select", "round_type");
			for (typeID in roundNames) {
				var roundTypeOption = createNewElement(roundTypeSelect, "option", "", roundNames[typeID]);
					roundTypeOption.setAttribute("value", typeID);	
			}
			roundTypeSelect.value = events[eventID].default_round[0];

		var numSolvesTD = createNewElement(newEventTR, "td");
		var numSolvesInput = createNewElement(numSolvesTD, "input", "num_solves");
			numSolvesInput.setAttribute("type", "number");
			numSolvesInput.setAttribute("value", events[eventID].default_round[1]);
			numSolvesInput.setAttribute("min", "0");

		var removeTD = createNewElement(newEventTR, "td");
		var removeButton = createNewElement(removeTD, "button", "", "X");
			removeButton.setAttribute("onclick", "this.parentElement.parentElement.parentElement.removeChild(this.parentElement.parentElement); scramble.updateSetCount(\"" + eventID + "\");");
	}

	var updateSetCount = function(eventID) {
		var eventTBody = document.getElementById("tbody_" + eventID);
		document.getElementById("amount_value_"+eventID).value = eventTBody.children.length;
	}

	var randomSource = undefined;

	var initializeRandomSource = function() {
		
		// We use the date the the native PRNG to get some entropy.
		var seed = new Date().getTime() + Math.floor(Math.random()*0xffffffff);
		
		// Make sure we don't actually use deterministic initialization.
		if (isFinite(seed)) {
			randomSource = new MersenneTwisterObject(seed);
			console.log("scramble.js: Seeded Mersenne Twister.");
			Math.random = undefined; // So we won't use it by accident.

		}
		else {
			randomSource = Math;
  			console.log("WARNING: Seeding Mersenne Twister did not work. Falling back to Math.random().");
  		}
	}

	// For seeding the workers.
	var getRandomSeed = function() {
		return (new Date().getTime() + Math.floor(randomSource.random()*0xffffffff));
	}


	var createNewElement = function(elementToAppendTo, type, className, content) {

		var newElement = document.createElement(type);
		if (className) {
			newElement.setAttribute("class", className);
		}
		if (content) {
			newElement.innerHTML = content
		}
		elementToAppendTo.appendChild(newElement);
		return newElement;
	};

	var doneCreatingRounds = false;
	var scramblesStillAwaiting = [];

	var currentID = "0";

	var nextID = function() {
		return "auto_id_" + (currentID++);
	}

	var startScramble = function(trID, eventID, num) {
					
		var scrambleTR = document.getElementById(trID);
		scrambleTR.innerHTML = "";
		var tempTD = createNewElement(scrambleTR, "td", "loading_scramble", "Generating scramble #" + num + "...");
			tempTD.setAttribute("colspan", 3);
	}

	var iniScramblerNotice = function(trID, eventID, num) {
					
		var scrambleTR = document.getElementById(trID);
		scrambleTR.innerHTML = "";
		var tempTD = createNewElement(scrambleTR, "td", "loading_scrambler", "Initializing scrambler...");
			tempTD.setAttribute("colspan", 3);
	}

	var insertScramble = function(trID, eventID, num, scramble, state) {

		if (usingWebWorkers) {

			var stillRemainingString = "";
			if (doneCreatingRounds) {
				stillRemainingString = " " + scramblesStillAwaiting.length + " scrambles still remaining overall."
			}

			addUpdateSpecific("Generated " + eventID + " scramble #" + num + " for some round." + stillRemainingString);

			var index = scramblesStillAwaiting.indexOf(trID);
			scramblesStillAwaiting.splice(index, 1)

			if (scramblesStillAwaiting.length == 0 && doneCreatingRounds) {
				addUpdateGeneral("\n\nDone generating all scrambles for all rounds.\n");
			}
		}
					
		var scrambleTR = document.getElementById(trID);
		scrambleTR.innerHTML = "";
		createNewElement(scrambleTR, "td", "", "" + num + ".");
		createNewElement(scrambleTR, "td", "scramble_" + eventID, scramble);
		var drawingTD = createNewElement(scrambleTR, "td", "drawing");
		//var drawingCenter = createNewElement(drawingTD, "center"); // It's 2011, and there's still not a better way to center this. :-/

		scramblers[eventID].drawScramble(drawingTD, state);
	}

	var generate_scramble_set = function(continuation, competitionName, tBody, eventID, scrambler, num, numTotal, options) {
		
		//addUpdateSpecific("Generating scramble #" + num + " of " + numTotal + ".");

		var scrambleTR = createNewElement(tBody, "tr");
		var trID = nextID();
		scrambleTR.setAttribute("id", trID);

		if (usingWebWorkers) {

			var tempTD = createNewElement(scrambleTR, "td", "", "[Space for Scramble #" + num + "]");
			tempTD.setAttribute("colspan", 3);

			scramblesStillAwaiting.push(trID);

			events[eventID].worker.postMessage({
				action: "get_random_scramble",
				event_id: eventID,
				return_data: {
					trID: trID,
					num: num
				}
			});
		}
		else {
			var scramble = scrambler.getRandomScramble();
			insertScramble(trID, eventID, num, scramble.scramble, scramble.state);
		}

		var call;
		if (num < numTotal) {
			call = generate_scramble_set.bind(null, continuation, competitionName, tBody, eventID, scrambler, num+1, numTotal, options);
		}
		else {
			hideUpdatesSpecific();
			call = continuation;
		}
		setTimeout(call, 0);
	}

	var add_page = function(continuation, competitionName, eventID, roundName, numScrambles) {

		var pages = document.getElementById("scramble_sets");

		if (!events[eventID]) {
			var newPage = createNewElement(pages, "div", "unupported", "Sorry, but \"" + eventID + "\" scrambles are not currently supported.");
			return;
		}

		var scrambler = scramblers[eventID];

		// Create a new Page.
		
		var newPage = createNewElement(pages, "div", "scramble_set");

			// Header Table

			var newInfoTable = createNewElement(newPage, "table", "info_table");
				var newInfoTHead = createNewElement(newInfoTable, "thead");
					var newInfoTR = createNewElement(newInfoTHead, "tr");
						
						createNewElement(newInfoTR, "td", "puzzle_name", events[eventID].name);
						createNewElement(newInfoTR, "td", "competition_name", competitionName);
						createNewElement(newInfoTR, "td", "round_name", roundName);

			// Scrambles Table

			var newScramblesTable = createNewElement(newPage, "table", "scramble_table");
				var newScramblesTBody = createNewElement(newScramblesTable, "tbody");
					
			// Footer Table

			var newFooterTable = createNewElement(newPage, "table", "footer_table");
				var newFooterTHead = createNewElement(newFooterTable, "thead");
					var newFooterTR = createNewElement(newFooterTHead, "tr");

						createNewElement(newFooterTR, "td", "", '<u>Scrambles generated at:</u><br>' + (new Date().toString()));
						createNewElement(newFooterTR, "td", "", '<div style="text-align: right;"><u>' + events[eventID].name + ' Scrambler Version</u><br>' + scrambler.version + '</div>');
						createNewElement(newFooterTR, "td", "", '<img src="inc/wca_logo.svg" class="wca_logo">');
		
		// Generate those scrambles!
		
		addUpdateGeneral("Generating " + numScrambles + " scramble" + ((numScrambles == 1) ? "" : "s") + " for " + events[eventID].name + ": " + roundName + "");
		resetUpdatesSpecific("Details for " + events[eventID].name + ": " + roundName);
		
		var nextContinuation = generate_scramble_set.bind(null, continuation, competitionName, newScramblesTBody, eventID, scrambler, 1, numScrambles, {});
		var call;
		if (!usingWebWorkers && !events[eventID].initialized) {
		    addUpdateSpecific("Initializing " + events[eventID].name + " scrambler (only needs to be done once).");

		    var statusCallback = function(str) {
		    	addUpdateSpecific(str);

		    }

			call = scrambler.initialize.bind(null, nextContinuation, randomSource, statusCallback);
			events[eventID].initialized = true;
		}
		else {

			if (usingWebWorkers) {
			    if (scrambler.initializeDrawing) {
			    	console.log("Initializing drawing code for " + events[eventID].name + ".");
			    	scrambler.initializeDrawing();
			    }
			}
			else if (events[eventID].initialized) {
		    	addUpdateSpecific("" + events[eventID].name + " scrambler already initialized.");
			}
			call = nextContinuation;
		}
		setTimeout(call, 0);
	};

	var generate_scrambles = function(callback, competitionName, rounds) {

		var nextContinuation;
		if (rounds.length > 1) {
			nextContinuation = generate_scrambles.bind(null, callback, competitionName, rounds.slice(1));
		}
		else {
			nextContinuation = function(){

				if (usingWebWorkers) {
					addUpdateGeneral("Done creating all rounds. " + scramblesStillAwaiting.length + " scrambles still need to be filled in.");
					doneCreatingRounds = true;
				}
				else {
					addUpdateGeneral("Done creating all rounds.");
				}

				setTimeout(callback, 0);
			};
		}

		document.title = "Scrambles for " + competitionName;

		add_page(nextContinuation, competitionName, rounds[0][0], rounds[0][1], rounds[0][2]);
	}

	var showUpdates = function() {
		document.getElementById("updates").style.display = "block";
	}

	var hideUpdates = function() {
		document.getElementById("updates").style.display = "none";
	}

	var showUpdatesSpecific = function() {
		document.getElementById("updates_specific").style.display = "block";
	}

	var hideUpdatesSpecific = function() {
		document.getElementById("updates_specific").style.display = "none";
	}

	var hideInterface = function() {
		var interfaceElements = document.getElementsByClassName("interface");
		for (var i=0; i < interfaceElements.length; i++) {
			interfaceElements[i].style.display = "none";
		}
	}

	var showInterface = function() {
		var interfaceElements = document.getElementsByClassName("interface");
		for (var i=0; i < interfaceElements.length; i++) {
			interfaceElements[i].style.display = "none";
		}
	}

	var benchmarkMode = false;
	var benchmarkString = "";

	var currentTime = function() {
		return (new Date()).getTime();
	}

	var updatesGeneralStartTime;
	var updatesGeneralLastTime;
	var resetUpdatesGeneral = function() {

		var updatesGeneralDiv = document.getElementById("updates_general");
		updatesGeneralDiv.innerHTML = "";
		createNewElement(updatesGeneralDiv, "h2", "", "Updates");

		showUpdates();

		updatesGeneralLastTime = updatesGeneralStartTime = currentTime();
	}

	var updatesSpecificStartTime;
	var updatesSpecificLastTime;
	var resetUpdatesSpecific = function(str) {

		var updatesSpecificDiv = document.getElementById("updates_specific");
		updatesSpecificDiv.innerHTML = "";
		createNewElement(updatesSpecificDiv, "h2", "", str);

		showUpdatesSpecific();

		updatesSpecificLastTime = updatesSpecificStartTime = currentTime();
	}

	var addUpdateGeneral = function(str) {

		console.log(str);
		var updatesGeneralDiv = document.getElementById("updates_general");

		createNewElement(updatesGeneralDiv, "li", "", str);

		if (benchmarkMode) {
			var cur = currentTime();
			benchmarkString = "- General [" + (cur - updatesGeneralLastTime) + "ms, " + (cur - updatesGeneralStartTime) + "ms] " + str + "\n" + benchmarkString;
			updatesGeneralLastTime = cur;
			document.getElementById("benchmark_details").innerHTML = "Benchmark In Progress:\n\n" + benchmarkString;
		}
	}

	var addUpdateSpecific = function(str) {

		console.log(str);
		var updatesSpecificDiv = document.getElementById("updates_specific");

		createNewElement(updatesSpecificDiv, "li", "", str);

		if (benchmarkMode) {
			var cur = currentTime();
			benchmarkString = "- Detail [" + (cur - updatesSpecificLastTime) + "ms, " + (cur - updatesSpecificStartTime) + "ms, " + (cur - updatesGeneralStartTime) + "ms] " + str + "\n" + benchmarkString;
			updatesSpecificLastTime = cur;
			document.getElementById("benchmark_details").innerHTML = "Benchmark In Progress:\n\n" + benchmarkString;
		}
	}

	var go = function() {

		resetUpdatesGeneral();
		hideInterface();

		var pages = [];
		var competitionName = document.getElementById('competitionName').value;


		var eventsTBody = document.getElementById("events_tbody").children;

		for (var i = 0; i < eventsTBody.length; i++) {

			var tr = eventsTBody[i];

			var eventID = tr.getAttribute("data-event-id");

			var roundName = tr.getElementsByClassName("round_name")[0].value;
			var roundType = tr.getElementsByClassName("round_type")[0].value;
			var numSolves = tr.getElementsByClassName("num_solves")[0].value;

			pages.push([eventID, roundName + " (" + roundNames[roundType] + " " + numSolves + ")", numSolves]);
		}

		if (pages.length == 0) {
			addUpdateGeneral("Nothing to do, because there are no rounds to scramble.");
			return;
		}

		addUpdateGeneral("Generating " + pages.length + " round" + ((pages.length == 1) ? "" : "s") + " of scrambles.");

		generate_scrambles(hideUpdates, competitionName, pages);
	};

	var benchmark = function() {

		resetUpdatesGeneral();
		resetUpdatesSpecific();
		benchmarkMode = true;

		benchmarkString = "\nBenchmark Settings:\n" + 
			"- Web Workers: " + (usingWebWorkers? "yes" : "no") + "\n" +
			"- Benchmark version: 4 (November 29, 2011)";

		hideInterface();
		document.getElementById("benchmark").style.display="block";
		document.getElementById("updates").style.display="none";

		// Give everyone the same benchmark.
		randomSource = new MersenneTwisterObject(12345);

		for (i in workers) {
			workers[i].postMessage({action: "initialize_benchmark", random_seed: Math.floor(randomSource.random()*0xffffffff)});
		}

		var callback = function (){
			//document.getElementById("benchmark_details").innerHTML = "Benchmark Results:\n\nDone!\n\n" + benchmarkString;
		};
		generate_scrambles(callback, "Benchmark", [
			["222", "Round 2x2x2", 5],
			["333", "Round 3x3x3", 5],
			["444", "Round 4x4x4", 5],
			["555", "Round 5x5x5", 5],
			["666", "Round 6x6x6", 3],
			["777", "Round 7x7x7", 3],
			["clock", "Round Clock", 5],
			["pyram", "Round Pyraminx", 5],
			["minx", "Round Megaminx", 5],
			["sq1", "Round Square-1", 5],
			["333", "Round 3x3x3 Again", 5]
		]);
	}

	return {
		version: version,
		events: events,
		initialize: initialize,
		generate_scrambles: generate_scrambles,
		go: go,
		addRound: addRound,
		benchmark: benchmark,
		updateSetCount: updateSetCount
	};
})();