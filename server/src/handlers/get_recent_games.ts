import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type Game } from '../schema';
import { desc } from 'drizzle-orm';

export const getRecentGames = async (): Promise<Game[]> => {
  try {
    // Query games ordered by created_at DESC, limit to 10 most recent
    const results = await db.select()
      .from(gamesTable)
      .orderBy(desc(gamesTable.created_at))
      .limit(10)
      .execute();

    // Transform database results to match schema
    return results.map(game => ({
      id: game.id,
      board_state: game.board_state as Game['board_state'], // Cast JSONB to proper type
      current_player: game.current_player,
      status: game.status,
      winner: game.winner,
      created_at: game.created_at,
      updated_at: game.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch recent games:', error);
    throw error;
  }
};