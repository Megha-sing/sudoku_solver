// sudokuUtils.js

// Check if placing num at grid[row][col] is safe
export const isSafe = (grid, row, col, num) => {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (grid[boxRow][boxCol] === num) return false;
  }
  return true;
};

// Solve sudoku with backtracking, returns solved grid or null if unsolvable
export const solveSudoku = (grid) => {
  const solve = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isSafe(grid, row, col, num)) {
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

// Shuffle an array in-place
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Generate a fully solved Sudoku grid (backtracking + shuffle)
const generateFullSolution = () => {
  const grid = Array(9).fill(0).map(() => Array(9).fill(0));

  const fill = (row = 0, col = 0) => {
    if (row === 9) return true;
    if (col === 9) return fill(row + 1, 0);

    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const num of numbers) {
      if (isSafe(grid, row, col, num)) {
        grid[row][col] = num;
        if (fill(row, col + 1)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  };

  fill();
  return grid;
};

// Generate Sudoku puzzle by removing numbers based on difficulty
export const generateSudoku = (difficulty = "easy") => {
  const fullSolution = generateFullSolution();
  const puzzle = fullSolution.map(row => row.slice());

  let removeCount;
  if (difficulty === "easy") removeCount = 30;
  else if (difficulty === "medium") removeCount = 40;
  else removeCount = 50;

  while (removeCount > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removeCount--;
    }
  }

  const fixedCells = puzzle.map(row => row.map(val => val !== 0));
  return { puzzle, fixedCells };
};
