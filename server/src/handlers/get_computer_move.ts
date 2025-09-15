import { type BoardState, type Player, type Position } from '../schema';

export function getComputerMove(board: BoardState, computerPlayer: Player): Position {
  const humanPlayer: Player = computerPlayer === 'X' ? 'O' : 'X';
  
  // Helper function to check if a player can win in one move
  const canWin = (player: Player): Position | null => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      const positions = [board[a], board[b], board[c]];
      
      // Check if two positions have the player's mark and one is empty
      const playerCount = positions.filter(pos => pos === player).length;
      const emptyCount = positions.filter(pos => pos === null).length;
      
      if (playerCount === 2 && emptyCount === 1) {
        // Find the empty position
        if (board[a] === null) return a as Position;
        if (board[b] === null) return b as Position;
        if (board[c] === null) return c as Position;
      }
    }
    return null;
  };

  // Helper function to get available positions
  const getAvailablePositions = (): Position[] => {
    const available: Position[] = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        available.push(i as Position);
      }
    }
    return available;
  };

  // 1. Win: If computer can win in one move, take it
  const winningMove = canWin(computerPlayer);
  if (winningMove !== null) {
    return winningMove;
  }

  // 2. Block: If human can win in one move, block it
  const blockingMove = canWin(humanPlayer);
  if (blockingMove !== null) {
    return blockingMove;
  }

  const availablePositions = getAvailablePositions();
  
  // 3. Center: Take center position (4) if available
  if (availablePositions.includes(4)) {
    return 4;
  }

  // 4. Corners: Take corners (0,2,6,8) if available
  const corners = [0, 2, 6, 8] as Position[];
  const availableCorners = corners.filter(corner => availablePositions.includes(corner));
  if (availableCorners.length > 0) {
    return availableCorners[0];
  }

  // 5. Sides: Take sides (1,3,5,7) as last resort
  const sides = [1, 3, 5, 7] as Position[];
  const availableSides = sides.filter(side => availablePositions.includes(side));
  if (availableSides.length > 0) {
    return availableSides[0];
  }

  // Fallback: return first available position (should never happen in valid game)
  return availablePositions[0] || 0 as Position;
}