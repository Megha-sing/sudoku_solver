// Generates a puzzle with a variable number of filled cells based on difficulty
export const generateSudoku = (difficulty = "medium") => {
  const puzzle = Array(9).fill(null).map(() => Array(9).fill(0));

  // Set attempts based on difficulty
  let attempts;
  switch (difficulty) {
    case "easy":
      attempts = 30; // More cells filled
      break;
    case "medium":
      attempts = 20;
      break;
    case "hard":
      attempts = 10; // Fewer cells filled
      break;
    default:
      attempts = 20;
  }

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
