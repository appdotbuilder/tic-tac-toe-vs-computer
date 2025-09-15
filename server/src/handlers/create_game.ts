import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type CreateGameInput, type Game } from '../schema';

export const createGame = async (input: CreateGameInput): Promise<Game> => {
  try {
    // Initialize empty 3x3 board (array of 9 nulls)
    const emptyBoard: (null)[] = Array(9).fill(null);
    
    // Determine players - human chooses X or O, computer gets the opposite
    const humanPlayer = input.human_player;
    const computerPlayer = humanPlayer === 'X' ? 'O' : 'X';
    
    // X always goes first in Tic-Tac-Toe
    const currentPlayer = 'X';
    
    // Insert new game record
    const result = await db.insert(gamesTable)
      .values({
        board_state: emptyBoard as any, // JSONB field accepts the array
        current_player: currentPlayer,
        status: 'in_progress',
        winner: null
      })
      .returning()
      .execute();

    const game = result[0];
    
    // Return with proper typing for board_state
    return {
      ...game,
      board_state: game.board_state as (null | 'X' | 'O')[]
    };
  } catch (error) {
    console.error('Game creation failed:', error);
    throw error;
  }
};