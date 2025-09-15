import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type CreateGameInput } from '../schema';
import { createGame } from '../handlers/create_game';
import { eq } from 'drizzle-orm';

describe('createGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a game with default human player X', async () => {
    const testInput: CreateGameInput = {
      human_player: 'X' // This is the default, but being explicit
    };

    const result = await createGame(testInput);

    // Verify game structure
    expect(result.id).toBeDefined();
    expect(result.board_state).toEqual(Array(9).fill(null));
    expect(result.current_player).toEqual('X'); // X always goes first
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a game with human player O', async () => {
    const testInput: CreateGameInput = {
      human_player: 'O'
    };

    const result = await createGame(testInput);

    // Verify game structure
    expect(result.id).toBeDefined();
    expect(result.board_state).toEqual(Array(9).fill(null));
    expect(result.current_player).toEqual('X'); // X always goes first regardless of human choice
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should use default human player X when not specified', async () => {
    // Test with empty object - Zod will apply the default
    const testInput = {} as CreateGameInput; // Cast to bypass TS error, Zod handles defaults

    const result = await createGame(testInput);

    expect(result.board_state).toEqual(Array(9).fill(null));
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
  });

  it('should save game to database correctly', async () => {
    const testInput: CreateGameInput = {
      human_player: 'X'
    };

    const result = await createGame(testInput);

    // Query the database to verify the game was saved
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, result.id))
      .execute();

    expect(games).toHaveLength(1);
    const savedGame = games[0];
    
    expect(savedGame.id).toEqual(result.id);
    expect(savedGame.board_state).toEqual(Array(9).fill(null));
    expect(savedGame.current_player).toEqual('X');
    expect(savedGame.status).toEqual('in_progress');
    expect(savedGame.winner).toBeNull();
    expect(savedGame.created_at).toBeInstanceOf(Date);
    expect(savedGame.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple games with unique IDs', async () => {
    const testInput: CreateGameInput = {
      human_player: 'X'
    };

    const game1 = await createGame(testInput);
    const game2 = await createGame(testInput);

    // Verify both games are created with different IDs
    expect(game1.id).toBeDefined();
    expect(game2.id).toBeDefined();
    expect(game1.id).not.toEqual(game2.id);

    // Verify both games exist in database
    const allGames = await db.select()
      .from(gamesTable)
      .execute();

    expect(allGames).toHaveLength(2);
    expect(allGames.map(g => g.id)).toContain(game1.id);
    expect(allGames.map(g => g.id)).toContain(game2.id);
  });

  it('should initialize board with exactly 9 null positions', async () => {
    const testInput: CreateGameInput = {
      human_player: 'O'
    };

    const result = await createGame(testInput);

    // Verify board structure
    expect(Array.isArray(result.board_state)).toBe(true);
    expect(result.board_state).toHaveLength(9);
    
    // Verify all positions are null (empty)
    result.board_state.forEach((position, index) => {
      expect(position).toBeNull();
    });
  });
});