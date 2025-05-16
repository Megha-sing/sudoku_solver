import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Utility to check if placing num at grid[row][col] is valid
const isSafe = (grid, row, col, num) => {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + i % 3;
    if (grid[boxRow][boxCol] === num) return false;
  }
  return true;
};

// Solve Sudoku with backtracking
const solveSudoku = (grid) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

// Generate a fully solved sudoku grid
const generateFullGrid = () => {
  const grid = Array(9).fill(0).map(() => Array(9).fill(0));
  const fillGrid = () => {
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      if (grid[row][col] === 0) {
        let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle numbers array
        numbers.sort(() => Math.random() - 0.5);
        for (let num of numbers) {
          if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid()) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
    return true;
  };
  fillGrid();
  return grid;
};

// Remove cells to create puzzle based on difficulty
const generateSudoku = (difficulty = "easy") => {
  let attempts;
  if (difficulty === "easy") attempts = 40;
  else if (difficulty === "medium") attempts = 50;
  else attempts = 60; // hard

  const fullGrid = generateFullGrid();

  // Deep copy grid for puzzle
  const puzzle = fullGrid.map(row => row.slice());

  while (attempts > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== 0) {
      // Backup cell value
      const backup = puzzle[row][col];
      puzzle[row][col] = 0;

      // Check if puzzle still solvable with one unique solution
      const copyGrid = puzzle.map(r => r.slice());
      if (!solveSudoku(copyGrid)) {
        // Revert if no solution
        puzzle[row][col] = backup;
        attempts--;
      } else {
        attempts--;
      }
    }
  }

  const fixedCells = puzzle.map(row => row.map(val => val !== 0));
  return { puzzle, fixedCells };
};

// Check if current grid is solved and valid (no conflicts, no zeros)
const isSolved = (grid) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = grid[row][col];
      if (val === 0) return false;
      // Temporarily clear cell to check validity
      grid[row][col] = 0;
      if (!isSafe(grid, row, col, val)) {
        grid[row][col] = val; // revert
        return false;
      }
      grid[row][col] = val; // revert
    }
  }
  return true;
};

function App() {
  const initial = generateSudoku("easy");
  const [grid, setGrid] = useState(initial.puzzle);
  const [fixedCells, setFixedCells] = useState(initial.fixedCells);
  const [conflictCells, setConflictCells] = useState(new Set());
  const [hintsLeft, setHintsLeft] = useState(3);
  const [difficulty, setDifficulty] = useState("easy");

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Show dialog with optional auto-close timeout
  const showDialog = (message, autoClose = false) => {
    setDialogMessage(message);
    setIsDialogOpen(true);
    if (autoClose) {
      setTimeout(() => setIsDialogOpen(false), 3000);
    }
  };

  const closeDialog = () => {
    setDialogMessage("");
    setIsDialogOpen(false);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // When difficulty changes, reset puzzle and timer
  useEffect(() => {
    const newPuzzle = generateSudoku(difficulty);
    setGrid(newPuzzle.puzzle);
    setFixedCells(newPuzzle.fixedCells);
    setHintsLeft(3);
    setConflictCells(new Set());
    setTime(0);
    setIsRunning(false);
  }, [difficulty]);

  // Validate input and check conflicts
  const handleChange = (e, row, col) => {
    if (fixedCells[row][col]) return;

    const val = e.target.value;
    const newGrid = grid.map(r => r.slice());

    if (val === "" || (/^[1-9]$/.test(val) && val.length === 1)) {
      newGrid[row][col] = val === "" ? 0 : parseInt(val);
      setGrid(newGrid);

      // Conflict detection
      const conflicts = new Set();
      const num = parseInt(val);
      if (!num) {
        setConflictCells(new Set());
        return;
      }

      // Row conflicts
      for (let c = 0; c < 9; c++) {
        if (c !== col && newGrid[row][c] === num) {
          conflicts.add(`${row}-${c}`);
          conflicts.add(`${row}-${col}`);
        }
      }

      // Column conflicts
      for (let r = 0; r < 9; r++) {
        if (r !== row && newGrid[r][col] === num) {
          conflicts.add(`${r}-${col}`);
          conflicts.add(`${row}-${col}`);
        }
      }

      // Box conflicts
      const boxRowStart = 3 * Math.floor(row / 3);
      const boxColStart = 3 * Math.floor(col / 3);
      for (let r = boxRowStart; r < boxRowStart + 3; r++) {
        for (let c = boxColStart; c < boxColStart + 3; c++) {
          if ((r !== row || c !== col) && newGrid[r][c] === num) {
            conflicts.add(`${r}-${c}`);
            conflicts.add(`${row}-${col}`);
          }
        }
      }

      setConflictCells(conflicts);

      // Check if solved on every valid input
      if (conflicts.size === 0 && isSolved(newGrid)) {
        showDialog("🎉 Congratulations! You solved the Sudoku!", true);
        setIsRunning(false);
      }
    }
  };

  const loadNewPuzzle = () => {
    const newPuzzle = generateSudoku(difficulty);
    setGrid(newPuzzle.puzzle);
    setFixedCells(newPuzzle.fixedCells);
    setHintsLeft(3);
    setConflictCells(new Set());
    setTime(0);
    setIsRunning(false);
  };

  const loadBlankPuzzle = () => {
    const blankGrid = Array(9).fill(0).map(() => Array(9).fill(0));
    const blankFixed = Array(9).fill(0).map(() => Array(9).fill(false));
    setGrid(blankGrid);
    setFixedCells(blankFixed);
    setHintsLeft(3);
    setConflictCells(new Set());
    setTime(0);
    setIsRunning(false);
  };

  const solveCurrentPuzzle = () => {
    const copyGrid = grid.map(r => r.slice());
    if (solveSudoku(copyGrid)) {
      setGrid(copyGrid);
      setConflictCells(new Set());
      setIsRunning(false);
    } else {
      showDialog("No solution found!");
    }
  };

  const giveHint = () => {
    if (hintsLeft === 0) {
      showDialog("No hints left!");
      return;
    }
    const copyGrid = grid.map(r => r.slice());
    if (!solveSudoku(copyGrid)) {
      showDialog("No solution found to provide hints!");
      return;
    }
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const newGrid = grid.map(r => r.slice());
          newGrid[row][col] = copyGrid[row][col];
          setGrid(newGrid);
          setHintsLeft(hintsLeft - 1);
          return;
        }
      }
    }
    showDialog("No empty cells to give hints!");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="app">
      <h1>Sudoku</h1>

      <div>
        <label htmlFor="difficulty-select">Select Difficulty: </label>
        <select
          id="difficulty-select"
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="sudoku-grid" style={{ marginTop: "20px" }}>
        {grid.map((row, rIdx) =>
          row.map((val, cIdx) => {
            const isFixed = fixedCells[rIdx][cIdx];
            const key = `${rIdx}-${cIdx}`;
            const isConflict = conflictCells.has(key);

            const extraBorders = [
              rIdx % 3 === 0 ? "thick-top" : "",
              cIdx % 3 === 0 ? "thick-left" : "",
              rIdx === 8 ? "thick-bottom" : "",
              cIdx === 8 ? "thick-right" : ""
            ].join(" ");

            return (
              <input
                key={key}
                className={`cell ${isFixed ? "fixed" : ""} ${extraBorders} ${isConflict ? "wrong" : ""}`}
                maxLength="1"
                value={val === 0 ? "" : val}
                onChange={(e) => handleChange(e, rIdx, cIdx)}
                type="text"
                inputMode="numeric"
                pattern="[1-9]*"
                disabled={isFixed}
                autoComplete="off"
              />
            );
          })
        )}
      </div>

      <div className="buttons" style={{ marginTop: "20px" }}>
        <button onClick={loadNewPuzzle}>New Puzzle</button>
        <button onClick={loadBlankPuzzle}>Load Blank Puzzle</button>
        <button onClick={giveHint}>Hint ({hintsLeft} left)</button>
        <button onClick={solveCurrentPuzzle}>Solve</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <div>Timer: {formatTime(time)}</div>
        <button onClick={() => setIsRunning(true)} disabled={isRunning}>Start Timer</button>
        <button onClick={() => setIsRunning(false)} disabled={!isRunning}>Stop Timer</button>
        <button onClick={() => { setTime(0); setIsRunning(false); }}>Reset Timer</button>
      </div>

      {isDialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <p>{dialogMessage}</p>
            {!dialogMessage.includes("Congratulations") && (
              <button onClick={closeDialog}>OK</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
