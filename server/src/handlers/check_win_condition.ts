import { type BoardState, type Player } from '../schema';

export function checkWinCondition(board: BoardState): { winner: Player | null; isGameOver: boolean } {
  // Define all winning combinations
  const winningCombinations = [
    // Rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Columns
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonals
    [0, 4, 8],
    [2, 4, 6]
  ];

  // Check for a winner
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a] as Player,
        isGameOver: true
      };
    }
  }

  // Check for draw (all positions filled but no winner)
  const isBoardFull = board.every(position => position !== null);
  
  if (isBoardFull) {
    return {
      winner: null,
      isGameOver: true
    };
  }

  // Game is still in progress
  return {
    winner: null,
    isGameOver: false
  };
}