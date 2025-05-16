import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const isSafe = (grid, row, col, num) => {
  if (grid[row][col] !== 0) return false;
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + i % 3;
    if (grid[boxRow][boxCol] === num) return false;
  }
  return true;
};

const solveSudoku = (grid) => {
  const isValid = (row, col, num) => {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + i % 3;
      if (grid[boxRow][boxCol] === num) return false;
    }
    return true;
  };

  const solve = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(row, col, num)) {
              grid[row][col] = num;
              if (solve()) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  return solve() ? grid : null;
};

const generateSudoku = (difficulty = "easy") => {
  const puzzle = Array(9).fill(0).map(() => Array(9).fill(0));
  let attempts;
  if (difficulty === "easy") attempts = 30;
  else if (difficulty === "medium") attempts = 20;
  else attempts = 10;
  while (attempts > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    const num = Math.floor(Math.random() * 9) + 1;
    if (isSafe(puzzle, row, col, num)) {
      puzzle[row][col] = num;
      attempts--;
    }
  }
  const fixedCells = puzzle.map(row => row.map(val => val !== 0));
  return { puzzle, fixedCells };
};

function App() {
  const initial = generateSudoku();
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

  const showDialog = (message) => {
    setDialogMessage(message);
    setIsDialogOpen(true);
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

  useEffect(() => {
    setTime(0);
    setIsRunning(false);
  }, [grid, difficulty]);

  const handleChange = (e, row, col) => {
    if (fixedCells[row][col]) return;

    const val = e.target.value;
    const newGrid = grid.map(r => r.slice());

    if (val === "" || (/^[1-9]$/.test(val) && val.length === 1)) {
      newGrid[row][col] = val === "" ? 0 : parseInt(val);
      setGrid(newGrid);

      const conflicts = new Set();
      const num = parseInt(val);
      if (!num) {
        setConflictCells(new Set());
        return;
      }

      for (let c = 0; c < 9; c++) {
        if (c !== col && newGrid[row][c] === num) {
          conflicts.add(`${row}-${c}`);
          conflicts.add(`${row}-${col}`);
        }
      }

      for (let r = 0; r < 9; r++) {
        if (r !== row && newGrid[r][col] === num) {
          conflicts.add(`${r}-${col}`);
          conflicts.add(`${row}-${col}`);
        }
      }

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
    }
  };

  const loadNewPuzzle = () => {
    const newPuzzle = generateSudoku(difficulty);
    setGrid(newPuzzle.puzzle);
    setFixedCells(newPuzzle.fixedCells);
    setHintsLeft(3);
    setConflictCells(new Set());
  };

  const loadBlankPuzzle = () => {
    const blankGrid = Array(9).fill(0).map(() => Array(9).fill(0));
    const blankFixed = Array(9).fill(0).map(() => Array(9).fill(false));
    setGrid(blankGrid);
    setFixedCells(blankFixed);
    setHintsLeft(3);
    setConflictCells(new Set());
  };

  const solveCurrentPuzzle = () => {
    const copyGrid = grid.map(r => r.slice());
    const solved = solveSudoku(copyGrid);
    if (solved) {
      setGrid(solved);
      setConflictCells(new Set());
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
    const solved = solveSudoku(copyGrid);
    if (!solved) {
      showDialog("No solution found to provide hints!");
      return;
    }
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const newGrid = grid.map(r => r.slice());
          newGrid[row][col] = solved[row][col];
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
          onChange={e => {
            setDifficulty(e.target.value);
            const newPuzzle = generateSudoku(e.target.value);
            setGrid(newPuzzle.puzzle);
            setFixedCells(newPuzzle.fixedCells);
            setHintsLeft(3);
            setConflictCells(new Set());
          }}
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
            <button onClick={closeDialog}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
