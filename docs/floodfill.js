"use strict";

(() => {
  window.addEventListener("load", (event) => {

    // Canvas references
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    // UI references
    const restartButton = document.querySelector("#restart");
    const colorSelectButtons = document.querySelectorAll(".color-select");
    const undoButton = document.getElementById('undo-btn');
    const transposeButton = document.getElementById('transpose-btn');

    // Constants
    const CELL_COLORS = {
      white: [255, 255, 255],
      black: [0, 0, 0],
      red: [255, 0, 0],
      green: [0, 255, 0],
      blue: [0, 0, 255]
    }
    const CELLS_PER_AXIS = 9;
    const CELL_WIDTH = canvas.width / CELLS_PER_AXIS;
    const CELL_HEIGHT = canvas.height / CELLS_PER_AXIS;

    // Game objects
    let replacementColor = CELL_COLORS.white;
    let grids = [];
    let playerScore = 500;
    let moveCount = 0;
    let undoCount = 3;
    let timerInterval = null;
    let timeCounter = 0;
    let leaderboard = [];

    // Start the game
    startGame();

    function startGame(startingGrid = []) {
      if (startingGrid.length === 0) {
        startingGrid = initializeGrid();
      }
      initializeHistory(startingGrid);
      render(grids[0]);
      playerScore = 500;
      moveCount = 0;
      undoCount = 3;
      updateScoreDisplay();
      updateMoveCounter();
      updateUndoButton();
      startTimer();
    }

    // Initialize the grid
    function initializeGrid() {
      const newGrid = [];
      for (let i = 0; i < CELLS_PER_AXIS * CELLS_PER_AXIS; i++) {
        newGrid.push(chooseRandomPropertyFrom(CELL_COLORS));
      }
      return newGrid;
    }

    // Initialize game history
    function initializeHistory(startingGrid) {
      grids = [];
      grids.push(startingGrid);
    }

    // Render the grid
    function render(grid) {
      for (let i = 0; i < grid.length; i++) {
        ctx.fillStyle = `rgb(${grid[i][0]}, ${grid[i][1]}, ${grid[i][2]})`;
        ctx.fillRect((i % CELLS_PER_AXIS) * CELL_WIDTH, Math.floor(i / CELLS_PER_AXIS) * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
      }
    }

    // Update the grid at a specific cell
    function updateGridAt(mousePositionX, mousePositionY) {
      const gridCoordinates = convertCartesiansToGrid(mousePositionX, mousePositionY);
      const newGrid = grids[grids.length - 1].slice(); //Makes a copy of the most recent grid state
      floodFill(newGrid, gridCoordinates, newGrid[gridCoordinates.row * CELLS_PER_AXIS + gridCoordinates.column]);
      grids.push(newGrid);
      render(grids[grids.length - 1]);
      moveCount++;  // Increment move count
      updateMoveCounter();
      checkIfGameWon();
    }

    // Flood fill algorithm
    function floodFill(grid, gridCoordinate, colorToChange) {
      if (arraysAreEqual(colorToChange, replacementColor)) { return } 
      else if (!arraysAreEqual(grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column], colorToChange)) { return } 
      else {
        grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column] = replacementColor;
        floodFill(grid, { column: Math.max(gridCoordinate.column - 1, 0), row: gridCoordinate.row }, colorToChange);
        floodFill(grid, { column: Math.min(gridCoordinate.column + 1, CELLS_PER_AXIS - 1), row: gridCoordinate.row }, colorToChange);
        floodFill(grid, { column: gridCoordinate.column, row: Math.max(gridCoordinate.row - 1, 0) }, colorToChange);
        floodFill(grid, { column: gridCoordinate.column, row: Math.min(gridCoordinate.row + 1, CELLS_PER_AXIS - 1) }, colorToChange);
      }
      return
    }

    // Restart the game
    function restart() {
      startGame(grids[0]);
    }

    // Time-based scoring system
    function startTimer() {
      timerInterval = setInterval(() => {
        if (playerScore > 0) {
          playerScore--;  // Decrease score by 1 every second
        }
        timeCounter++;  // Increment time counter
        updateScoreDisplay();
      }, 1000);
    }

    function stopTimer() {
      clearInterval(timerInterval);  // Stop the timer
    }

    // Check if the game is won
    function checkIfGameWon() {
      const firstColor = grids[grids.length - 1][0];
      const allSameColor = grids[grids.length - 1].every(color => arraysAreEqual(color, firstColor));
      if (allSameColor) {
        stopTimer();
        alert(`You won! Final Score: ${playerScore}`);
        updateLeaderboard(playerScore);  // Update leaderboard with final score
      }
    }

    // Leaderboard functionality
    function updateLeaderboard(score) {
      leaderboard.push(score);
      leaderboard.sort((a, b) => b - a);  // Sort scores from highest to lowest
      if (leaderboard.length > 5) leaderboard.pop();  // Keep top 5 scores
      displayLeaderboard();
    }

    function displayLeaderboard() {
      const leaderboardElement = document.getElementById('leaderboard');
      leaderboardElement.innerHTML = leaderboard.map((score, index) => `<p>${index + 1}. ${score}</p>`).join('');
    }

    // Update game stats display
    function updateScoreDisplay() {
      document.getElementById('player-score').innerText = `Score: ${playerScore}`;
    }

    function updateMoveCounter() {
      document.getElementById('move-counter').innerText = `Moves: ${moveCount}`;
    }

    function updateUndoButton() {
      undoButton.innerText = `Undo (${undoCount} left)`;
    }

    // Limited undo functionality
    function undoLastMove() {
      if (undoCount > 0 && grids.length > 1) {
        grids.pop();  // Remove the most recent grid state
        undoCount--;
        render(grids[grids.length - 1]);  // Re-render the previous state
        updateUndoButton();
      } else {
        alert("No undos left!");
      }
    }

    // Transpose grid functionality (Bonus)
    function transposeGrid() {
      const newGrid = grids[grids.length - 1].slice();  // Copy the current grid state
      const size = CELLS_PER_AXIS;
      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          // Swap elements across the main diagonal
          [newGrid[i * size + j], newGrid[j * size + i]] = [newGrid[j * size + i], newGrid[i * size + j]];
        }
      }
      grids.push(newGrid);  // Save the transposed grid
      render(newGrid);  // Render the transposed grid
    }

    // Event Listeners
    canvas.addEventListener("mousedown", gridClickHandler);
    function gridClickHandler(event) {
      updateGridAt(event.offsetX, event.offsetY);
    }

    restartButton.addEventListener("mousedown", restartClickHandler);
    function restartClickHandler() {
      restart();
    }

    colorSelectButtons.forEach(button => {
      button.addEventListener("mousedown", () => replacementColor = CELL_COLORS[button.name]);
    });

    undoButton.addEventListener('click', undoLastMove);
    transposeButton.addEventListener('click', transposeGrid);

    // Helper Functions
    function convertCartesiansToGrid(xPos, yPos) {
      return {
        column: Math.floor(xPos / CELL_WIDTH),
        row: Math.floor(yPos / CELL_HEIGHT)
      };
    }

    function chooseRandomPropertyFrom(object) {
      const keys = Object.keys(object);
      return object[keys[Math.floor(keys.length * Math.random())]]; //Truncates to integer
    };

    function arraysAreEqual(arr1, arr2) {
      if (arr1.length != arr2.length) { return false }
      else {
        for (let i = 0; i < arr1.length; i++) {
          if (arr1[i] != arr2[i]) {
            return false;
          }
        }
        return true;
      }
    }

  });
})();
