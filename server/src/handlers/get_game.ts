import { db } from '../db';
import { gamesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetGameInput, type Game } from '../schema';

export const getGame = async (input: GetGameInput): Promise<Game> => {
  try {
    // Query the games table by ID
    const results = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, input.game_id))
      .execute();

    // Check if game exists
    if (results.length === 0) {
      throw new Error(`Game with ID ${input.game_id} not found`);
    }

    // Return the game data
    const game = results[0];
    return {
      id: game.id,
      board_state: game.board_state as (null | 'X' | 'O')[], // Cast JSONB to proper type
      current_player: game.current_player,
      status: game.status,
      winner: game.winner,
      created_at: game.created_at,
      updated_at: game.updated_at
    };
  } catch (error) {
    console.error('Game retrieval failed:', error);
    throw error;
  }
};