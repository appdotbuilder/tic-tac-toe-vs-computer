import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type MakeMoveInput, type GameMoveResponse, type Player, type BoardState, type GameStatus } from '../schema';
import { eq } from 'drizzle-orm';

export async function makeMove(input: MakeMoveInput): Promise<GameMoveResponse> {
  try {
    // 1. Fetch the game from database by game_id
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, input.game_id))
      .execute();

    if (games.length === 0) {
      throw new Error(`Game with id ${input.game_id} not found`);
    }

    const game = games[0];
    
    // 2. Validate game is in progress and position is valid/empty
    if (game.status !== 'in_progress') {
      throw new Error('Game is not in progress');
    }

    const boardState = game.board_state as BoardState;
    if (boardState[input.position] !== null) {
      throw new Error('Position is already occupied');
    }

    // 3. Make human player's move on the board
    const humanPlayer = game.current_player;
    const computerPlayer: Player = humanPlayer === 'X' ? 'O' : 'X';
    const newBoardState = [...boardState];
    newBoardState[input.position] = humanPlayer;

    // 4. Check for win/draw after human move
    let gameStatus: GameStatus = game.status;
    let winner: Player | null = game.winner;
    let message = 'Move processed successfully';
    let computerMove = null;
    
    const humanWon = checkWin(newBoardState, humanPlayer);
    const isDraw = checkDraw(newBoardState);
    
    if (humanWon) {
      gameStatus = 'won';
      winner = humanPlayer;
      message = `Player ${humanPlayer} wins!`;
    } else if (isDraw) {
      gameStatus = 'draw';
      message = 'Game ended in a draw!';
    } else {
      // 5. If game continues, generate computer move using AI strategy
      const computerPosition = generateComputerMove(newBoardState, computerPlayer, humanPlayer);
      newBoardState[computerPosition] = computerPlayer;
      computerMove = {
        player: computerPlayer,
        position: computerPosition
      };

      // 6. Check for win/draw after computer move
      const computerWon = checkWin(newBoardState, computerPlayer);
      const isDrawAfterComputer = checkDraw(newBoardState);
      
      if (computerWon) {
        gameStatus = 'won';
        winner = computerPlayer;
        message = `Computer (${computerPlayer}) wins!`;
      } else if (isDrawAfterComputer) {
        gameStatus = 'draw';
        message = 'Game ended in a draw!';
      }
    }

    // 7. Update game state in database
    const updatedGame = await db.update(gamesTable)
      .set({
        board_state: newBoardState,
        current_player: computerPlayer, // Switch turns for next move
        status: gameStatus,
        winner: winner,
        updated_at: new Date()
      })
      .where(eq(gamesTable.id, input.game_id))
      .returning()
      .execute();

    // 8. Return response with both moves and updated game state
    return {
      game: {
        id: updatedGame[0].id,
        board_state: updatedGame[0].board_state as BoardState,
        current_player: updatedGame[0].current_player,
        status: updatedGame[0].status,
        winner: updatedGame[0].winner,
        created_at: updatedGame[0].created_at,
        updated_at: updatedGame[0].updated_at
      },
      human_move: {
        player: humanPlayer,
        position: input.position
      },
      computer_move: computerMove,
      game_over: gameStatus !== 'in_progress',
      message: message
    };
  } catch (error) {
    console.error('Move processing failed:', error);
    throw error;
  }
}

// Helper function to check if a player has won
function checkWin(board: BoardState, player: Player): boolean {
  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  return winningCombos.some(combo => 
    combo.every(position => board[position] === player)
  );
}

// Helper function to check if the game is a draw
function checkDraw(board: BoardState): boolean {
  return board.every(cell => cell !== null);
}

// Generate computer move using minimax algorithm
function generateComputerMove(board: BoardState, computer: Player, human: Player): number {
  const availablePositions = board
    .map((cell, index) => cell === null ? index : null)
    .filter(pos => pos !== null) as number[];

  if (availablePositions.length === 0) {
    throw new Error('No available moves');
  }

  // Use minimax algorithm to find the best move
  let bestScore = -Infinity;
  let bestMove = availablePositions[0];

  for (const position of availablePositions) {
    const testBoard = [...board];
    testBoard[position] = computer;
    const score = minimax(testBoard, 0, false, computer, human);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = position;
    }
  }

  return bestMove;
}

// Minimax algorithm implementation
function minimax(board: BoardState, depth: number, isMaximizing: boolean, computer: Player, human: Player): number {
  // Check terminal states
  if (checkWin(board, computer)) return 10 - depth;
  if (checkWin(board, human)) return depth - 10;
  if (checkDraw(board)) return 0;

  const availablePositions = board
    .map((cell, index) => cell === null ? index : null)
    .filter(pos => pos !== null) as number[];

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const position of availablePositions) {
      const testBoard = [...board];
      testBoard[position] = computer;
      const score = minimax(testBoard, depth + 1, false, computer, human);
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const position of availablePositions) {
      const testBoard = [...board];
      testBoard[position] = human;
      const score = minimax(testBoard, depth + 1, true, computer, human);
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
}