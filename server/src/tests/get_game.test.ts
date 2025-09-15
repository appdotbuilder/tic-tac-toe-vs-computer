import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type GetGameInput, type Player, type GameStatus } from '../schema';
import { getGame } from '../handlers/get_game';

describe('getGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing game by ID', async () => {
    // Create test game data
    const testBoardState: ('X' | 'O' | null)[] = ['X', 'O', null, 'X', null, 'O', null, null, null];
    const testGameData = {
      board_state: testBoardState,
      current_player: 'X' as Player,
      status: 'in_progress' as GameStatus,
      winner: null as Player | null
    };

    // Insert test game into database
    const insertResult = await db.insert(gamesTable)
      .values(testGameData)
      .returning()
      .execute();

    const insertedGame = insertResult[0];
    const testInput: GetGameInput = { game_id: insertedGame.id };

    // Test the handler
    const result = await getGame(testInput);

    // Verify all fields are returned correctly
    expect(result.id).toEqual(insertedGame.id);
    expect(result.board_state).toEqual(testBoardState);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve a completed game with winner', async () => {
    // Create test game data for a won game
    const testBoardState: ('X' | 'O' | null)[] = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
    const testGameData = {
      board_state: testBoardState,
      current_player: 'O' as Player,
      status: 'won' as GameStatus,
      winner: 'X' as Player
    };

    // Insert test game into database
    const insertResult = await db.insert(gamesTable)
      .values(testGameData)
      .returning()
      .execute();

    const insertedGame = insertResult[0];
    const testInput: GetGameInput = { game_id: insertedGame.id };

    // Test the handler
    const result = await getGame(testInput);

    // Verify game state for completed game
    expect(result.id).toEqual(insertedGame.id);
    expect(result.board_state).toEqual(testBoardState);
    expect(result.current_player).toEqual('O');
    expect(result.status).toEqual('won');
    expect(result.winner).toEqual('X');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve a draw game', async () => {
    // Create test game data for a draw game
    const testBoardState: ('X' | 'O' | null)[] = ['X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', 'O'];
    const testGameData = {
      board_state: testBoardState,
      current_player: 'X' as Player,
      status: 'draw' as GameStatus,
      winner: null as Player | null
    };

    // Insert test game into database
    const insertResult = await db.insert(gamesTable)
      .values(testGameData)
      .returning()
      .execute();

    const insertedGame = insertResult[0];
    const testInput: GetGameInput = { game_id: insertedGame.id };

    // Test the handler
    const result = await getGame(testInput);

    // Verify draw game state
    expect(result.id).toEqual(insertedGame.id);
    expect(result.board_state).toEqual(testBoardState);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('draw');
    expect(result.winner).toBeNull();
  });

  it('should throw error when game does not exist', async () => {
    const nonExistentGameId = 999999;
    const testInput: GetGameInput = { game_id: nonExistentGameId };

    // Test that handler throws error for non-existent game
    await expect(getGame(testInput)).rejects.toThrow(/Game with ID 999999 not found/i);
  });

  it('should handle empty board state correctly', async () => {
    // Create test game with empty board
    const testBoardState: ('X' | 'O' | null)[] = Array(9).fill(null);
    const testGameData = {
      board_state: testBoardState,
      current_player: 'X' as Player,
      status: 'in_progress' as GameStatus,
      winner: null as Player | null
    };

    // Insert test game into database
    const insertResult = await db.insert(gamesTable)
      .values(testGameData)
      .returning()
      .execute();

    const insertedGame = insertResult[0];
    const testInput: GetGameInput = { game_id: insertedGame.id };

    // Test the handler
    const result = await getGame(testInput);

    // Verify empty board handling
    expect(result.board_state).toEqual(testBoardState);
    expect(result.board_state).toHaveLength(9);
    expect(result.board_state.every(cell => cell === null)).toBe(true);
  });

  it('should preserve exact timestamps from database', async () => {
    // Create test game data
    const testGameData = {
      board_state: Array(9).fill(null) as ('X' | 'O' | null)[],
      current_player: 'X' as Player,
      status: 'in_progress' as GameStatus,
      winner: null as Player | null
    };

    // Insert test game into database
    const insertResult = await db.insert(gamesTable)
      .values(testGameData)
      .returning()
      .execute();

    const insertedGame = insertResult[0];
    const testInput: GetGameInput = { game_id: insertedGame.id };

    // Test the handler
    const result = await getGame(testInput);

    // Verify timestamps match exactly
    expect(result.created_at).toEqual(insertedGame.created_at);
    expect(result.updated_at).toEqual(insertedGame.updated_at);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});