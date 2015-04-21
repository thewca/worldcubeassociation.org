/*

scramble_sq1.js

Square-1 Solver / Scramble Generator in Javascript.

Ported from PPT, written Walter Souza: https://bitbucket.org/walter/puzzle-timer/src/7049018bbdc7/src/com/puzzletimer/solvers/Square1Solver.java
Ported by Lucas Garron, November 16, 2011.

TODO:
- Try to ini using pregenerated JSON.
- Try to optimize arrays (byte arrays?).

*/

if (typeof scramblers == "undefined") {
  var scramblers = {};
}

scramblers["sq1"] = (function() {

  var makeArrayZeroed = function(len) {
    var array, i;
    array = new Array(len);
    for(i = 0; i < len; i++) {
      array[i] = 0;
    }
    return array;
  };

  var make2DArray = function(lenOuter, lenInner) {
    var i, outer;
    outer = new Array(lenOuter);
    for(i = 0; i < lenOuter; i++) {
      outer[i] = new Array(lenInner);
    }
    return outer;
  };

  /*
   * IndexMapping helper methods.
   */

  var IndexMappingPermutationToIndex = function(permutation) {
    var i, index, j;
    index = 0;
    if (permutation.length == 0) {
      return index;
    }
    for(i = 0; i < permutation.length - 1; i++) {
      index *= permutation.length - i;
      for (j = i + 1; j < permutation.length; j++) {
        if (permutation[i] > permutation[j]) {
          index++;
        }
      }
    }
    if (index == 46436297) {
      iiii = 4;
    }
    return index;
  };

  var IndexMappingIndexToPermutation = function(index, length) {
    var i, j, permutation;
    permutation = new Array(length);
    permutation[length - 1] = 0;
    for (i = length - 2; i >= 0; i--) {
      permutation[i] = index % (length - i);
      index = Math.floor(index / (length - i));
      for (j = i + 1; j < length; j++) {
        if (permutation[j] >= permutation[i]) {
          permutation[j]++;
        }
      }
    }
    return permutation;
  };

  var IndexMappingOrientationToIndex = function(orientation, nValues) {
    var i, index;
    index = 0;
    for(i = 0; i < orientation.length; i++) {
      index = nValues * index + orientation[i];
    }
    return index;
  };

  var IndexMappingNChooseK = function(n, k) {
    var i, value;
    value = 1;
    for(i = 0; i < k; i++) {
      value *= n - i;
    }
    for(i = 0; i < k; i++) {
      value /= k - i;
    }
    return value;
  };

  var IndexMappingCombinationToIndex = function(combination, k) {
    var i, index;
    index = 0;
    for (i = combination.length - 1; i >= 0 && k >= 0; i--) {
      if (combination[i]) {
        index += IndexMappingNChooseK(i, k--);
      }
    }
    return index;
  };

  var IndexMappingIndexToCombination = function(index, k, length) {
    var combination, i;
    combination = new Array(length);
    for (i = length - 1; i >= 0 && k >= 0; i--) {
      if (index >= IndexMappingNChooseK(i, k)) {
        combination[i] = true;
        index -= IndexMappingNChooseK(i, k--);
      }
    }
    return combination;
  };

  /*
   * State helper methods.
   */

  identityState = [0, 8, 1, 1, 9, 2, 2, 10, 3, 3, 11, 0, 4, 12, 5, 5, 13, 6, 6, 14, 7, 7, 15, 4];

  var stateIsTwistable = function(permutation) {
    return permutation[1] !== permutation[2] && permutation[7] !== permutation[8] && permutation[13] !== permutation[14] && permutation[19] !== permutation[20];
  };

  var stateMultiply = function(permutation, move) {
    var i, newPermutation;
    newPermutation = new Array(24);
    for(i = 0; i < 24; i++) {
      newPermutation[i] = permutation[move[i]];
    }
    return newPermutation;
  };

  var stateGetShapeIndex = function(permutation) {
    var cuts, i, next;
    cuts = new Array(24);
    for(i = 0; i < 24; i++) {
      cuts[i] = 0;
    }
    for (i = 0; i <= 11; i++) {
      next = (i + 1) % 12;
      if (permutation[i] !== permutation[next]) {
        cuts[i] = 1;
      }
    }
    for (i = 0; i <= 11; i++) {
      next = (i + 1) % 12;
      if (permutation[12 + i] !== permutation[12 + next]) {
        cuts[12 + i] = 1;
      }
    }
    return IndexMappingOrientationToIndex(cuts, 2);
  };

  var stateGetPiecesPermutation = function(permutation) {
    var i, newPermutation, next, nextSlot;
    newPermutation = new Array(16);
    nextSlot = 0;
    for (i = 0; i <= 11; i++) {
      next = (i + 1) % 12;
      if (permutation[i] !== permutation[next]) {
        newPermutation[nextSlot++] = permutation[i];
      }
    }
    for (i = 0; i <= 11; i++) {
      next = 12 + (i + 1) % 12;
      if (permutation[12 + i] !== permutation[next]) {
        newPermutation[nextSlot++] = permutation[12 + i];
      }
    }
    return newPermutation;
  };

  /*
   * Cube state helper methods.
   */

  var stateToCubeState = function(permutation) {
    var cornerIndices, cornersPermutation, edgeIndices, edgesPermutation, i;
    cornerIndices = [0, 3, 6, 9, 12, 15, 18, 21];
    cornersPermutation = new Array(8);
    for(i = 0; i < 8; i++) {
      cornersPermutation[i] = permutation[cornerIndices[i]];
    }
    edgeIndices = [1, 4, 7, 10, 13, 16, 19, 22];
    edgesPermutation = new Array(8);
    for(i = 0; i < 8; i++) {
      edgesPermutation[i] = permutation[edgeIndices[i]] - 8;
    }
    return [cornersPermutation, edgesPermutation];
  };

  var cubeStateMultiply = function(state, move) {
    var cornersPermutation, edgesPermutation, i;
    cornersPermutation = new Array(8);
    edgesPermutation = new Array(8);
    for (i = 0; i < 8; i++) {
      cornersPermutation[i] = state[0][move[0][i]];
      edgesPermutation[i] = state[1][move[1][i]];
    }
    return [cornersPermutation, edgesPermutation];
  };

  /*
   * Square-1 Solver methods.
   */

   // Private instance variables.
  var square1Solver_N_CORNERS_PERMUTATIONS = 40320;
  var square1Solver_N_CORNERS_COMBINATIONS = 70;
  var square1Solver_N_EDGES_PERMUTATIONS = 40320;
  var square1Solver_N_EDGES_COMBINATIONS = 70;
  var square1Solver_initialized = false;
  var square1Solver_shapes = new Array();
  var square1Solver_evenShapeDistance = {};
  var square1Solver_oddShapeDistance = {};
  var square1Solver_moves1 = new Array(23);
  var square1Solver_moves2;
  var square1Solver_cornersPermutationMove;
  var square1Solver_cornersCombinationMove;
  var square1Solver_edgesPermutationMove;
  var square1Solver_edgesCombinationMove;
  var square1Solver_cornersDistance;
  var square1Solver_edgesDistance;

  /*
   * If doneCallback is provided then this function will interrupt itself using timeouts.
   * This allows it to call statusCallback and doneCallback, in order to provide status update in a non-blocking UI.
   */
  var square1SolverInitialize = function(doneCallback, iniRandomSource, statusCallback) {
  
    setRandomSource(iniRandomSource);

    if (square1Solver_initialized) {
      if (doneCallback) {
        doneCallback();        
      }
      return;
    }

    var combination, corners, depth, distanceTable, edges, fringe, i, iii, initializationLastTime, initializationStartTime, isTopCorner, isTopEdge, j, k, logStatus, move, move01, move03, move10, move30, moveTwist, moveTwistBottom, moveTwistTop, nVisited, newFringe, next, nextBottom, nextCornerPermutation, nextCornersCombination, nextEdgeCombination, nextEdgesPermutation, nextTop, result, state, statusI, _i, _len;
    initializationStartTime = new Date().getTime();
    initializationLastTime = initializationStartTime;
    statusI = 0;

    var logStatus = function(statusString) {
      var initializationCurrentTime, outString;
      statusI++;
      initializationCurrentTime = new Date().getTime();
      outString = "" + statusI + ". " + statusString + " [" + (initializationCurrentTime - initializationLastTime) + "ms split, " + (initializationCurrentTime - initializationStartTime) + "ms total]";
      initializationLastTime = initializationCurrentTime;
      //console.log(outString);
      if (statusCallback != null) {
        statusCallback(outString);
      }
    };

    var ini = 0;
    var iniParts = new Array();

    var nextIniStep = function() {
      if (!doneCallback) {
        iniParts[ini++]();
      }
      else {
        setTimeout(iniParts[ini++], 0);
      }
    }

    iniParts[ini++] = function() {
    
      logStatus("Initializing Square-1 Solver.");
      
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      move10 = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      move = move10;
      for (i = 0; i <= 10; i++) {
        square1Solver_moves1[i] = move;
        move = stateMultiply(move, move10);
      }
      move01 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 12];
      move = move01;
      for (i = 0; i <= 10; i++) {
        square1Solver_moves1[11 + i] = move;
        move = stateMultiply(move, move01);
      }
      moveTwist = [0, 1, 19, 18, 17, 16, 15, 14, 8, 9, 10, 11, 12, 13, 7, 6, 5, 4, 3, 2, 20, 21, 22, 23];
      square1Solver_moves1[22] = moveTwist;

      logStatus("Generating shape tables.");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_evenShapeDistance[stateGetShapeIndex(identityState)] = 0;
      fringe = new Array();
      fringe.push(identityState);
      iii = 0;
      depth = 0;
      while (fringe.length > 0) {
        newFringe = new Array();
        for (_i = 0, _len = fringe.length; _i < _len; _i++) {
          state = fringe[_i];
          if (stateIsTwistable(state)) {
            square1Solver_shapes.push(state);
          }
          for(i = 0; i < square1Solver_moves1.length; i++) {
            if (!(i == 22 && !stateIsTwistable(state))) {
              next = stateMultiply(state, square1Solver_moves1[i]);
              distanceTable = null;
              if (isEvenPermutation(stateGetPiecesPermutation(next))) {
                distanceTable = square1Solver_evenShapeDistance;
              } else {
                distanceTable = square1Solver_oddShapeDistance;
              }
              if (!(distanceTable[stateGetShapeIndex(next)] != null)) {
                distanceTable[stateGetShapeIndex(next)] = depth + 1;
                newFringe.push(next);
              }
            }
          }
        }
        fringe = newFringe;
        depth++;
        if (depth == 10 || depth == 12 || depth == 15) {
          logStatus("Shape Table Depth: " + depth + "/20");
        }
      }
      move30 = [[3, 0, 1, 2, 4, 5, 6, 7], [3, 0, 1, 2, 4, 5, 6, 7]];
      move03 = [[0, 1, 2, 3, 5, 6, 7, 4], [0, 1, 2, 3, 5, 6, 7, 4]];
      moveTwistTop = [[0, 6, 5, 3, 4, 2, 1, 7], [6, 5, 2, 3, 4, 1, 0, 7]];
      moveTwistBottom = [[0, 6, 5, 3, 4, 2, 1, 7], [0, 5, 4, 3, 2, 1, 6, 7]];
      square1Solver_moves2 = [move30, cubeStateMultiply(move30, move30), cubeStateMultiply(cubeStateMultiply(move30, move30), move30), move03, cubeStateMultiply(move03, move03), cubeStateMultiply(cubeStateMultiply(move03, move03), move03), moveTwistTop, moveTwistBottom];


      logStatus("Generating move tables.");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      logStatus("Corner permutation move table...");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_cornersPermutationMove = make2DArray(square1Solver_N_CORNERS_PERMUTATIONS, square1Solver_moves2.length);
      for(i = 0; i < square1Solver_N_CORNERS_PERMUTATIONS; i++) {
        state = [IndexMappingIndexToPermutation(i, 8), makeArrayZeroed(8)];
        for(j = 0; j < square1Solver_moves2.length; j++) {
          square1Solver_cornersPermutationMove[i][j] = IndexMappingPermutationToIndex(cubeStateMultiply(state, square1Solver_moves2[j])[0]);
        }
      }
      
      logStatus("Corner combination move table...");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_cornersCombinationMove = make2DArray(square1Solver_N_CORNERS_COMBINATIONS, square1Solver_moves2.length);
      for(i = 0; i < square1Solver_N_CORNERS_COMBINATIONS; i++) {
        combination = IndexMappingIndexToCombination(i, 4, 8);
        corners = new Array(8);
        nextTop = 0;
        nextBottom = 4;
        for(j = 0; j < 8; j++) {
          if (combination[j]) {
            corners[j] = nextTop++;
          } else {
            corners[j] = nextBottom++;
          }
        }
        state = [corners, new Array(8)];
        for(j = 0; j < square1Solver_moves2.length; j++) {
          result = cubeStateMultiply(state, square1Solver_moves2[j]);
          isTopCorner = new Array(8);
          for(k = 0; k < 8; k++) {
            isTopCorner[k] = result[0][k] < 4;
          }
          square1Solver_cornersCombinationMove[i][j] = IndexMappingCombinationToIndex(isTopCorner, 4);
        }
      }

      logStatus("Edges permutation move table...");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_edgesPermutationMove = make2DArray(square1Solver_N_EDGES_PERMUTATIONS, square1Solver_moves2.length);
      for(i = 0; i < square1Solver_N_EDGES_PERMUTATIONS; i++) {
        state = [makeArrayZeroed(8), IndexMappingIndexToPermutation(i, 8)];
        for(j = 0; j < square1Solver_moves2.length; j++) {
          square1Solver_edgesPermutationMove[i][j] = IndexMappingPermutationToIndex(cubeStateMultiply(state, square1Solver_moves2[j])[1]);
          //console.log(":" + square1Solver_edgesPermutationMove[i][j] + ", " + state.toString() + ", " + square1Solver_moves2[j] + ", " + cubeStateMultiply(state, square1Solver_moves2[j]).toString());
        }
      }

      logStatus("Edges combination move table...");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_edgesCombinationMove = make2DArray(square1Solver_N_EDGES_COMBINATIONS, square1Solver_moves2.length);
      for(i = 0; i < square1Solver_N_EDGES_COMBINATIONS; i++) {
        combination = IndexMappingIndexToCombination(i, 4, 8);
        edges = new Array(8);
        nextTop = 0;
        nextBottom = 4;
        for(j = 0; j < 8; j++) {
          if (combination[j]) {
            edges[j] = nextTop++;
          } else {
            edges[j] = nextBottom++;
          }
        }
        state = [new Array(8), edges];
        for(j = 0; j < square1Solver_moves2.length; j++) {
          result = cubeStateMultiply(state, square1Solver_moves2[j]);
          isTopEdge = new Array(8);
          for(k = 0; k < 8; k++) {
            isTopEdge[k] = result[1][k] < 4;
          }
          square1Solver_edgesCombinationMove[i][j] = IndexMappingCombinationToIndex(isTopEdge, 4);
        }
      }

      logStatus("Generating prune tables.");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      logStatus("Corners distance prune table...");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_cornersDistance = make2DArray(square1Solver_N_CORNERS_PERMUTATIONS, square1Solver_N_EDGES_COMBINATIONS);
      for(i = 0; i < square1Solver_N_CORNERS_PERMUTATIONS; i++) {
        for(j = 0; j < square1Solver_N_EDGES_COMBINATIONS; j++) {
          square1Solver_cornersDistance[i][j] = -1;
        }
      }
      square1Solver_cornersDistance[0][0] = 0;
      while (true) {
        nVisited = 0;
        for(i = 0; i < square1Solver_N_CORNERS_PERMUTATIONS; i++) {
          for(j = 0; j < square1Solver_N_EDGES_COMBINATIONS; j++) {
            if (square1Solver_cornersDistance[i][j] == depth) {
              for(k = 0; k < square1Solver_moves2.length; k++) {
                nextCornerPermutation = square1Solver_cornersPermutationMove[i][k];
                nextEdgeCombination = square1Solver_edgesCombinationMove[j][k];
                if (square1Solver_cornersDistance[nextCornerPermutation][nextEdgeCombination] < 0) {
                  con;
                  square1Solver_cornersDistance[nextCornerPermutation][nextEdgeCombination] = depth + 1;
                  nVisited++;
                }
              }
            }
          }
        }
        depth++;
        if (!(nVisited > 0)) {
          break;
        }
      }

      logStatus("Edges distance prune table...");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_edgesDistance = make2DArray(square1Solver_N_EDGES_PERMUTATIONS, square1Solver_N_CORNERS_COMBINATIONS);
      for(i = 0; i < square1Solver_N_EDGES_PERMUTATIONS; i++) {
        for(j = 0; j < square1Solver_N_CORNERS_COMBINATIONS; j++) {
          square1Solver_edgesDistance[i][j] = -1;
        }
      }
      square1Solver_edgesDistance[0][0] = 0;

      depth = 0;
      while (true) {
        nVisited = 0;
        for(i = 0; i < square1Solver_N_EDGES_PERMUTATIONS; i++) {
          for(j = 0; j < square1Solver_N_CORNERS_COMBINATIONS; j++) {
            if (square1Solver_edgesDistance[i][j] == depth) {
              for(k = 0; k < square1Solver_moves2.length; k++) {
                nextEdgesPermutation = square1Solver_edgesPermutationMove[i][k];
                nextCornersCombination = square1Solver_cornersCombinationMove[j][k];
                if (square1Solver_edgesDistance[nextEdgesPermutation][nextCornersCombination] < 0) {
                  square1Solver_edgesDistance[nextEdgesPermutation][nextCornersCombination] = depth + 1;
                  nVisited++;
                }
              }
            }
          }
        }
        depth++;
        if (!(nVisited > 0)) {
          break;
        }
      }
        
      logStatus("Done initializing Square-1 Solver.");
      /* Callback Continuation */ nextIniStep();}; iniParts[ini++] = function() {

      square1Solver_initialized = true;
      if (doneCallback != null) {
        doneCallback();
      }
    }

    ini=0;
    nextIniStep();
  };

  var topIndexToAmount = function(index) {
    return (index == -1) ? 0 : index +1;
  }

  var bottomIndexToAmount = function(index) {
    return (index == -1) ? 0 : index - 10;
  }

  var topAmountToIndex = function(amount) {
    return (amount == 0) ? -1 : amount - 1;
  }

  var bottomAmountToIndex = function(amount) {
    return (amount == 0) ? -1 : amount + 10;
  }

  /*
   * - Converts to the format [top, bottom, /, top, bottom, /, ..., top, bottom]
   *  - This creates redundant moves, but those don't matter in square1SolverSolutionToString(...).
   * - Converts adjacent non-/ moves into (top, bottom). (even if one of these is 0)
   * - collapses consecutive / moves.
   */
  var square1SolverNormalizeSolution = function(solution) {
    var bottom, moveIndex, newSolution, top, _i, _len;
    newSolution = new Array();
    top = 0;
    bottom = 0;
    for (i = 0; i < solution.length; i++) {
      moveIndex = solution[i];
      if (moveIndex < 11) {
        top += moveIndex + 1;
        top %= 12;
      } else if (moveIndex < 22) {
        bottom += (moveIndex - 11) + 1;
        bottom %= 12;
      } else {
        if (solution[i-1] == 22) {
          newSolution.pop();
          bottom = bottomIndexToAmount(newSolution.pop());
          top = topIndexToAmount(newSolution.pop());
        }
        else {
          newSolution.push(topAmountToIndex(top));
          newSolution.push(bottomAmountToIndex(bottom));
          newSolution.push(22);
          top = 0;
          bottom = 0;
        }
      }
    }
    newSolution.push(topAmountToIndex(top));
    newSolution.push(bottomAmountToIndex(bottom));
    return newSolution;
  };

  var square1SolverSolutionEnsureMiddleParity = function(solution, middleIsSolved) {

    var simplifiedSolution = square1SolverNormalizeSolution(solution);
    var location60 = -1;
    var location06 = -1;
    var locationM0 = -1;
    var location0N = -1;
    var locationMN = -1;

    //console.log(square1SolverSolutionToString(simplifiedSolution).join(""));

    for (i = 0; i < simplifiedSolution.length - 2; i+=3) {
      if (!((0 <= simplifiedSolution[i] < 11 || simplifiedSolution[i] == -1) && (11 <= simplifiedSolution[i+2] < 22 || simplifiedSolution[i+2] == -1) && (simplifiedSolution[i+2] == 22))) {
        console.error("Improperly simplified (see indices " + i + " to " + (i+2) + "):" + simplifiedSolution); // Sanity check.
      }
      var top = simplifiedSolution[i];
      var bot = simplifiedSolution[i+1];

      // We allow later mateches to override earlier ones to prefer matches in the cubic phase. This helps make for easier scrambles.
      if (top == 5 && bot == -1) { // 5 is (6, 0)
        location60 = i;
      }
      else if (top == -1 && bot == 16) { // 16 is (0, 6)
        location06 = i;
      }
      else if (bot == -1) {
        locationM0 = i;
      }
      else if (top == -1) {
        location0N = i;
      }
      else {
        locationMN = i;
      }
    }
    if (!((0 <= simplifiedSolution[simplifiedSolution.length - 1] < 11 || simplifiedSolution[simplifiedSolution.length - 2] == -1) && (11 <= simplifiedSolution[simplifiedSolution.length - 2] < 22 || simplifiedSolution[simplifiedSolution.length - 1] == -1))) {
      console.error("Improperly simplified (see indices " + (simplifiedSolution.length-2) + " to " + (simplifiedSolution.length-1) + "):" + solution); // Sanity check.
    }

    // After sanity checks:
    if (((simplifiedSolution.length - 2)/3 % 2 == 0) == middleIsSolved) {
      //console.log("Middle parity is correct.");
      return solution;
    }


    if (location60 != -1) {
      simplifiedSolution.splice(location60 + 2, 1, 5,22,5,22,5);
    }
    else if (location06 != -1) {
      simplifiedSolution.splice(location06 + 2, 1, 16,22,16,22,16);
    }
    else if (locationM0 != -1) {
      simplifiedSolution.splice(locationM0 + 2, 1, 5,22,5,22,5);
    }
    else if (location0N != -1) {
      simplifiedSolution.splice(location0N + 2, 1, 16,22,16,22,16);
    }
    else {
      simplifiedSolution.splice(locationMN + 2, 1, 5,22,5,22,5);
    }

    //console.log([location60, location06, locationM0, location0N, locationMN]);
    simplifiedSolution = square1SolverNormalizeSolution(simplifiedSolution);
    //console.log(square1SolverSolutionToString(simplifiedSolution).join(""));
    return simplifiedSolution;
  };

  var square1SolverSolutionToString = function (solution) {
    var bottom, moveIndex, sequence, top, _i, _len;
    sequence = new Array();
    top = 0;
    bottom = 0;
    for (i = 0; i < solution.length; i++) {
      moveIndex = solution[i];
      if (moveIndex == -1){
        // Nothing.
      }
      if (moveIndex < 11) {
        top += moveIndex + 1;
        top %= 12;
      } else if (moveIndex < 22) {
        bottom += (moveIndex - 11) + 1;
        bottom %= 12;
      } else {
        if (top !== 0 || bottom !== 0) {
          if (top > 6) {
            top = -(12 - top);
          }
          if (bottom > 6) {
            bottom = -(12 - bottom);
          }
          sequence.push("(" + top + ", ", bottom + ")");
          top = 0;
          bottom = 0;
        }
        sequence.push(" / ");
      }
    }
    if (top !== 0 || bottom !== 0) {
      if (top > 6) {
        top = -(12 - top);
      }
      if (bottom > 6) {
        bottom = -(12 - bottom);
      }
      sequence.push("(" + top + ", ", bottom + ")");
    }
    return sequence;
  }

  var square1SolverSolve = function(position) {
    var solution = square1SolverSolution(position);
    return square1SolverSolutionToString(solution);
  };

  var square1SolverGenerate = function(position) {
    var solution = square1SolverSolution(position);
    //console.log("FF: "+ solution);
    var newSolution = [];
    for (i = solution.length-1; i >= 0; i--) {
      var move = solution[i];
      if (move < 0) {
        newSolution.push(-1);
      }
      else if (move < 11) {
        newSolution.push(10-move);
      }
      else if (move < 22) {
        newSolution.push(32-move);
      }
      else {
        newSolution.push(move);
      }
    }
    //console.log("FF2: "+ newSolution);
    return square1SolverSolutionToString(newSolution);
  };

  var square1SolverSolution = function(position) {
    var depth, moveIndex, phase1MoveIndex, phase2MoveMapping, sequence, solution1, solution2, _i, _j, _k, _len, _len2, _len3, _ref, _results;
    if (!square1Solver_initialized) {
      square1SolverInitialize();
    }
    depth = 0;
    _results = [];
    while (true) {
      solution1 = new Array();
      solution2 = new Array();
      if (square1SolverSearch(position["permutation"], isEvenPermutation(stateGetPiecesPermutation(position["permutation"])), depth, solution1, solution2)) {
        sequence = new Array();

        //console.log("L1: " + solution1.length);
        //console.log("L2: " + solution2.length);

        for (_i = 0, _len = solution1.length; _i < _len; _i++) {
          moveIndex = solution1[_i];
          sequence.push(moveIndex);
        }
        phase2MoveMapping = [[2], [5], [8], [13], [16], [19], [0, 22, 10], [21, 22, 11]];
        for (_j = 0, _len2 = solution2.length; _j < _len2; _j++) {
          moveIndex = solution2[_j];
          _ref = phase2MoveMapping[moveIndex];
          for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
            phase1MoveIndex = _ref[_k];
            sequence.push(phase1MoveIndex);
          }
        }
        //console.log("TT1: " + square1SolverSolutionToString(sequence).join(""));
        //console.log("TT1a: " + sequence);
        sequence = square1SolverSolutionEnsureMiddleParity(sequence, position["middleIsSolved"]);
        //console.log("TT2: " + square1SolverSolutionToString(sequence).join(""));
        //console.log("TT2a: " + sequence);
        return sequence;
      }
      depth++;
    }
    return _results;
  };

  var square1SolverSearch = function(state, stateIsEvenPermutation, depth, solution1, solution2) {
    var distance, i, m, next, sequence2, _i, _len;
    if (depth == 0) {
      if (stateIsEvenPermutation && (stateGetShapeIndex(state) == stateGetShapeIndex(identityState))) {
        sequence2 = square1SolverSolution2(stateToCubeState(state), 17);
        if (sequence2 !== null) {
          for (_i = 0, _len = sequence2.length; _i < _len; _i++) {
            m = sequence2[_i];
            solution2.push(m);
          }
          return true;
        }
      }
      return false;
    }
    distance = null;
    if (stateIsEvenPermutation) {
      distance = square1Solver_evenShapeDistance[stateGetShapeIndex(state)];
    } else {
      distance = square1Solver_oddShapeDistance[stateGetShapeIndex(state)];
    }
    if (distance <= depth) {
      for(i = 0; i < square1Solver_moves1.length; i++) {
        if (!(i == 22 && !stateIsTwistable(state))) {
          next = stateMultiply(state, square1Solver_moves1[i]);
          solution1.push(i);
          if (square1SolverSearch(next, isEvenPermutation(stateGetPiecesPermutation(next)), depth - 1, solution1, solution2)) {
            return true;
          }
          solution1.length -= 1;
        }
      }
    }
    return false;
  };

  var square1SolverSolution2 = function(state, maxDepth) {
    var cornersCombination, cornersPermutation, depth, edgesCombination, edgesPermutation, isTopCorner, isTopEdge, k, solution;
    cornersPermutation = IndexMappingPermutationToIndex(state[0]);
    isTopCorner = new Array(8);
    for(k = 0; k < 8; k++) {
      isTopCorner[k] = state[0][k] < 4;
    }
    cornersCombination = IndexMappingCombinationToIndex(isTopCorner, 4);
    edgesPermutation = IndexMappingPermutationToIndex(state[1]);
    isTopEdge = new Array(8);
    for(k = 0; k < 8; k++) {
      isTopEdge[k] = state[1][k] < 4;
    }
    edgesCombination = IndexMappingCombinationToIndex(isTopEdge, 4);
    for(depth = 0; depth < maxDepth + 1; depth++) {
      solution = makeArrayZeroed(depth);
      //console.log("Oink: " + cornersPermutation + ", " + cornersCombination + ", " + edgesPermutation + ", " + edgesCombination + ", " + depth + ", " + solution.toString());
      if (square1SolverSearch2(cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution)) {      
        return solution;
      }
    }
    return null;
  };

  var square1SolverSearch2 = function(cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution) {
    //var input = "Search 2 ini: " + cornersPermutation + ", " + cornersCombination + ", " + edgesPermutation + ", " + edgesCombination + ", " + depth + ", " + solution.toString();

    var i;
    if (depth == 0) {
      return (cornersPermutation == 0) && (edgesPermutation == 0);
    }
    if ((square1Solver_cornersDistance[cornersPermutation][edgesCombination] <= depth) && (square1Solver_edgesDistance[edgesPermutation][cornersCombination] <= depth)) {
      for(i = 0; i < square1Solver_moves2.length; i++) {
        if (!((solution.length - depth - 1 >= 0) && (Math.floor(solution[solution.length - depth - 1] / 3) == Math.floor(i / 3)))) {
          solution[solution.length - depth] = i;
          if (square1SolverSearch2(square1Solver_cornersPermutationMove[cornersPermutation][i], square1Solver_cornersCombinationMove[cornersCombination][i], square1Solver_edgesPermutationMove[edgesPermutation][i], square1Solver_edgesCombinationMove[edgesCombination][i], depth - 1, solution)) {
            //console.log("Search 2 subfinal: " + input);
            //console.log("Search 2 final: " + cornersPermutation + ", " + cornersCombination + ", " + edgesPermutation + ", " + edgesCombination + ", " + depth + ", " + solution.toString());

            return true;
          }
        }
      }
    }
    return false;
  };

  var square1SolverGetRandomPosition = function() {
    var cornersPermutation, edgesPermutation, i, permutation, shape, middleIsSolved;
    if (!square1Solver_initialized) {
      square1SolverInitialize();
    }
    shape = square1Solver_shapes[randomIntBelow(square1Solver_shapes.length)];
    cornersPermutation = IndexMappingIndexToPermutation(randomIntBelow(square1Solver_N_CORNERS_PERMUTATIONS), 8);
    edgesPermutation = IndexMappingIndexToPermutation(randomIntBelow(square1Solver_N_EDGES_PERMUTATIONS), 8);
    permutation = new Array(shape.length);
    for(i = 0; i < shape.length; i++) {
      if (shape[i] < 8) {
        permutation[i] = cornersPermutation[shape[i]];
      } else {
        permutation[i] = 8 + edgesPermutation[shape[i] - 8];
      }
    }
    middleIsSolved = (randomIntBelow(2) == 1) ? true : false;
    return {"permutation": permutation, "middleIsSolved": middleIsSolved};
  };

  /*
   * Some helper functions.
   */

  var square1SolverRandomSource = undefined;

  // If we have a better (P)RNG:
  var setRandomSource = function(src) {
    square1SolverRandomSource = src;
  }

  var randomIntBelow = function(n) {
    return Math.floor(square1SolverRandomSource.random() * n);
  };

  var isEvenPermutation = function(permutation) {
    var i, j, nInversions;
    nInversions = 0;
    for(i = 0; i < permutation.length; i++) {
      for (j = i + 1; j < permutation.length; j++) {
        if (permutation[i] > permutation[j]) {
          nInversions++;
        }
      }
    }
    return nInversions % 2 == 0;
  };

  var square1SolverGetRandomScramble = function() {
    var randomState = square1SolverGetRandomPosition();
    var scrambleString = square1SolverGenerate(randomState).join("");

    return {
      state: randomState,
      scramble: scrambleString
    };
  }

  /*
   * Drawing methods. These are extremely messy and outdated by now, but at least they work.
   */


  function colorGet(col){
    if (col=="r") return ("#FF0000");
    if (col=="o") return ("#FF8000");
    if (col=="b") return ("#0000FF");
    if (col=="g") return ("#00FF00");
    if (col=="y") return ("#FFFF00");
    if (col=="w") return ("#FFFFFF");
    if (col=="x") return ("#000000");
  }

function drawPolygon(r, fillColor, arrx, arry) {

  var pathString = "";
  for (var i = 0; i < arrx.length; i++) {
    pathString += ((i==0) ? "M" : "L") + arrx[i] + "," + arry[i];
  }
  pathString += "z";

  r.path(pathString).attr({fill: colorGet(fillColor), stroke: "#000"})
}
 
 
function drawSq(stickers, middleIsSolved, shapes, parentElement, colorString) {

    var z = 1.366 // sqrt(2) / sqrt(1^2 + tan(15 degrees)^2)
    var r = Raphael(parentElement, 200, 110);
    parentElement.width = 200;

    var arrx, arry;
   
    var margin = 1;
    var sidewid=.15*100/z;
    var cx = 50;
    var cy = 50;
    var radius=(cx-margin-sidewid*z)/z;
    var w = (sidewid+radius)/radius   // ratio btw total piece width and radius
   
    var angles=[0,0,0,0,0,0,0,0,0,0,0,0,0];
    var angles2=[0,0,0,0,0,0,0,0,0,0,0,0,0];
   
    //initialize angles
    for(var foo=0; foo<24; foo++){
      angles[foo]=(17-foo*2)/12*Math.PI;
      shapes = shapes.concat("xxxxxxxxxxxxxxxx");
    }
    for(var foo=0; foo<24; foo++){
      angles2[foo]=(19-foo*2)/12*Math.PI;
      shapes = shapes.concat("xxxxxxxxxxxxxxxx");
    }
    
    function cos1(index) {return Math.cos(angles[index])*radius;}
    function sin1(index) {return Math.sin(angles[index])*radius;}
    function cos2(index) {return Math.cos(angles2[index])*radius;}
    function sin2(index) {return Math.sin(angles2[index])*radius;}

    var h = sin1(1)*w*z - sin1(1)*z;
    if (middleIsSolved) {
      arrx=[cx+cos1(1)*w*z, cx+cos1(4)*w*z, cx+cos1(7)*w*z, cx+cos1(10)*w*z];
      arry=[cy-sin1(1)*w*z, cy-sin1(4)*w*z, cy-sin1(7)*w*z, cy-sin1(10)*w*z];
      drawPolygon(r, "x", arrx, arry);
      
      cy += 10;
      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(1)*w*z, cx+cos1(1)*w*z];
      arry=[cy-sin1(1)*w*z, cy-sin1(1)*z, cy-sin1(1)*z, cy-sin1(1)*w*z, cy-sin1(1)*w*z];
      drawPolygon(r, colorString[5], arrx, arry)

      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(10)*w*z, cx+cos1(10)*w*z];
      arry=[cy-sin1(1)*w*z, cy-sin1(1)*z, cy-sin1(1)*z, cy-sin1(1)*w*z, cy-sin1(1)*w*z];
      drawPolygon(r, colorString[5], arrx, arry)
      cy -= 10;
    }
    else {
      arrx=[cx+cos1(1)*w*z, cx+cos1(4)*w*z, cx+cos1(6)*w, cx+cos1(9)*w*z, cx+cos1(11)*w*z, cx+cos1(0)*w];
      arry=[cy-sin1(1)*w*z, cy-sin1(4)*w*z, cy-sin1(6)*w, cy+sin1(9)*w*z, cy-sin1(11)*w*z, cy-sin1(0)*w];
      drawPolygon(r, "x", arrx, arry);

      arrx=[cx+cos1(9)*w*z, cx+cos1(11)*w*z, cx+cos1(11)*w*z, cx+cos1(9)*w*z];
      arry=[cy+sin1(9)*w*z-h, cy-sin1(11)*w*z-h, cy-sin1(11)*w*z, cy+sin1(9)*w*z];
      drawPolygon(r, colorString[4], arrx, arry);

      cy += 10;
      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(1)*w*z, cx+cos1(1)*w*z];
      arry=[cy-sin1(1)*w*z, cy-sin1(1)*z, cy-sin1(1)*z, cy-sin1(1)*w*z];
      drawPolygon(r, colorString[5], arrx, arry)

      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(11)*w*z, cx+cos1(11)*w*z];
      arry=[cy-sin1(1)*w*z, cy-sin1(1)*z, cy-sin1(11)*w*z + h, cy-sin1(11)*w*z];
      drawPolygon(r, colorString[2], arrx, arry)
      cy -= 10;
    }
     
    //fill and outline first layer
    var sc = 0;
    for(var foo=0; sc<12; foo++){
      if (shapes.length<=foo) sc = 12;
      if (shapes.charAt(foo)=="x") sc++;
      if (shapes.charAt(foo)=="c"){
        arrx=[cx, cx+cos1(sc), cx+cos1(sc+1)*z, cx+cos1(sc+2)];
        arry=[cy, cy-sin1(sc), cy-sin1(sc+1)*z, cy-sin1(sc+2)];
        drawPolygon(r, stickers.charAt(foo), arrx, arry)
    
        arrx=[cx+cos1(sc), cx+cos1(sc+1)*z, cx+cos1(sc+1)*w*z, cx+cos1(sc)*w];
        arry=[cy-sin1(sc), cy-sin1(sc+1)*z, cy-sin1(sc+1)*w*z, cy-sin1(sc)*w];
        drawPolygon(r, stickers.charAt(16+sc), arrx, arry)
      
        arrx=[cx+cos1(sc+2), cx+cos1(sc+1)*z, cx+cos1(sc+1)*w*z, cx+cos1(sc+2)*w];
        arry=[cy-sin1(sc+2), cy-sin1(sc+1)*z, cy-sin1(sc+1)*w*z, cy-sin1(sc+2)*w];
        drawPolygon(r, stickers.charAt(17+sc), arrx, arry)
   
        sc +=2;
      }
      if (shapes.charAt(foo)=="e"){
        arrx=[cx, cx+cos1(sc), cx+cos1(sc+1)];
        arry=[cy, cy-sin1(sc), cy-sin1(sc+1)];
        drawPolygon(r, stickers.charAt(foo), arrx, arry)
    
        arrx=[cx+cos1(sc), cx+cos1(sc+1), cx+cos1(sc+1)*w, cx+cos1(sc)*w];
        arry=[cy-sin1(sc), cy-sin1(sc+1), cy-sin1(sc+1)*w, cy-sin1(sc)*w];
        drawPolygon(r, stickers.charAt(16+sc), arrx, arry)
    
        sc +=1;
      }
    }
   
    //fill and outline second layer
    cx += 100;  
    cy += 10;


    var h = sin1(1)*w*z - sin1(1)*z;
    if (middleIsSolved) {
      arrx=[cx+cos1(1)*w*z, cx+cos1(4)*w*z, cx+cos1(7)*w*z, cx+cos1(10)*w*z];
      arry=[cy+sin1(1)*w*z, cy+sin1(4)*w*z, cy+sin1(7)*w*z, cy+sin1(10)*w*z];
      drawPolygon(r, "x", arrx, arry);
      
      cy -= 10;
      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(1)*w*z, cx+cos1(1)*w*z];
      arry=[cy+sin1(1)*w*z, cy+sin1(1)*z, cy+sin1(1)*z, cy+sin1(1)*w*z, cy+sin1(1)*w*z];
      drawPolygon(r, colorString[5], arrx, arry)

      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(10)*w*z, cx+cos1(10)*w*z];
      arry=[cy+sin1(1)*w*z, cy+sin1(1)*z, cy+sin1(1)*z, cy+sin1(1)*w*z, cy+sin1(1)*w*z];
      drawPolygon(r, colorString[5], arrx, arry)
      cy += 10;
    }
    else {
      arrx=[cx+cos1(1)*w*z, cx+cos1(4)*w*z, cx+cos1(6)*w, cx+cos1(9)*w*z, cx+cos1(11)*w*z, cx+cos1(0)*w];
      arry=[cy+sin1(1)*w*z, cy+sin1(4)*w*z, cy+sin1(6)*w, cy-sin1(9)*w*z, cy+sin1(11)*w*z, cy+sin1(0)*w];
      drawPolygon(r, "x", arrx, arry);

      arrx=[cx+cos1(9)*w*z, cx+cos1(11)*w*z, cx+cos1(11)*w*z, cx+cos1(9)*w*z];
      arry=[cy-sin1(9)*w*z+h, cy+sin1(11)*w*z+h, cy+sin1(11)*w*z, cy-sin1(9)*w*z];
      drawPolygon(r, colorString[4], arrx, arry);

      cy -= 10;
      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(1)*w*z, cx+cos1(1)*w*z];
      arry=[cy+sin1(1)*w*z, cy+sin1(1)*z, cy+sin1(1)*z, cy+sin1(1)*w*z];
      drawPolygon(r, colorString[5], arrx, arry)

      arrx=[cx+cos1(0)*w, cx+cos1(0)*w, cx+cos1(11)*w*z, cx+cos1(11)*w*z];
      arry=[cy+sin1(1)*w*z, cy+sin1(1)*z, cy+sin1(11)*w*z - h, cy+sin1(11)*w*z];
      drawPolygon(r, colorString[2], arrx, arry)
      cy += 10;
    }

    var sc = 0;
    for(sc=0; sc<12; foo++){
      if (shapes.length<=foo) sc = 12;
      if (shapes.charAt(foo)=="x") sc++;
      if (shapes.charAt(foo)=="c"){
        arrx=[cx, cx+cos2(sc), cx+cos2(sc+1)*z, cx+cos2(sc+2)];
        arry=[cy, cy-sin2(sc), cy-sin2(sc+1)*z, cy-sin2(sc+2)];
        drawPolygon(r, stickers.charAt(foo), arrx, arry)
   
        arrx=[cx+cos2(sc), cx+cos2(sc+1)*z, cx+cos2(sc+1)*w*z, cx+cos2(sc)*w];
        arry=[cy-sin2(sc), cy-sin2(sc+1)*z, cy-sin2(sc+1)*w*z, cy-sin2(sc)*w];
        drawPolygon(r, stickers.charAt(28+sc), arrx, arry)
    
        arrx=[cx+cos2(sc+2), cx+cos2(sc+1)*z, cx+cos2(sc+1)*w*z, cx+cos2(sc+2)*w];
        arry=[cy-sin2(sc+2), cy-sin2(sc+1)*z, cy-sin2(sc+1)*w*z, cy-sin2(sc+2)*w];
        drawPolygon(r, stickers.charAt(29+sc), arrx, arry)

        sc +=2;
   
      }
      if (shapes.charAt(foo)=="e"){
        arrx=[cx, cx+cos2(sc), cx+cos2(sc+1)];
        arry=[cy, cy-sin2(sc), cy-sin2(sc+1)];
        drawPolygon(r, stickers.charAt(foo), arrx, arry)
    
        arrx=[cx+cos2(sc), cx+cos2(sc+1), cx+cos2(sc+1)*w, cx+cos2(sc)*w];
        arry=[cy-sin2(sc), cy-sin2(sc+1), cy-sin2(sc+1)*w, cy-sin2(sc)*w];
        drawPolygon(r, stickers.charAt(28+sc), arrx, arry)
   
        sc +=1;
      }
    }

  }

  var remove_duplicates = function(arr) {
    var out = [];
    var j=0;
    for (var i=0; i<arr.length; i++)
    {
      if(i==0 || arr[i]!=arr[i-1])
      out[j++] = arr[i];
    }
    return out;
  }

  var drawScramble = function(parentElement, state) {

    var colorString = "yobwrg";  //In dlburf order.
      
    var posit;
    var scrambleString;
    var tb, ty, col, eido;

    var permutation = state["permutation"];
    var middleIsSolved = state["middleIsSolved"];

    var posit = [];
    var map = [8,9,10, 11,0,1, 2,3,4, 5,6,7, 19,18,17, 16,15,14, 13,12,23, 22,21,20];
    for (j in map) {
      posit.push(permutation[map[j]]);
    }
        
    var tb = ["3","3","3","3","0","0","0","0","3","3","3","3","0","0","0","0"];
    ty = ["c","c","c","c","c","c","c","c","e","e","e","e","e","e","e","e"];
    col = ["12","24","45","51","21","42","54","15","2","4","5","1","2","4","5","1"];
 
    var top_side=remove_duplicates(posit.slice(0,12));
    var bot_side=remove_duplicates(posit.slice(18,24).concat(posit.slice(12,18)));
    var eido=top_side.concat(bot_side);

    var a="";
    var b="";
    var c="";
    var eq="_";
    for(var j=0; j<16; j++)
    {
      a+=ty[eido[j]];
      eq=eido[j];
      b+=tb[eido[j]];
      c+=col[eido[j]];
    }
    
    var stickers = (b.concat(c)
      .replace(/0/g,colorString[0])
      .replace(/1/g,colorString[1])
      .replace(/2/g,colorString[2])
      .replace(/3/g,colorString[3])
      .replace(/4/g,colorString[4])
      .replace(/5/g,colorString[5])
    );
    drawSq(stickers, middleIsSolved, a, parentElement, colorString);

  }

  /*
   * Export public methods.
   */

  return {

    /* mark2 interface */
    version: "November 22, 2011",
    initialize: square1SolverInitialize,
    setRandomSource: setRandomSource,
    getRandomScramble: square1SolverGetRandomScramble,
    drawScramble: drawScramble,

    /* Other methods */
    getRandomPosition: square1SolverGetRandomPosition,
    solve: square1SolverSolve,
    senerate: square1SolverGenerate,
  };

})();