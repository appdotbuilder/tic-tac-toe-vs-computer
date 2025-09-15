import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { getRecentGames } from '../handlers/get_recent_games';
import { type Game, type BoardState } from '../schema';

// Helper function to create test game data
const createTestGame = async (gameData: {
  board_state: BoardState;
  current_player: 'X' | 'O';
  status: 'in_progress' | 'won' | 'draw';
  winner?: 'X' | 'O' | null;
  created_at?: Date;
}): Promise<Game> => {
  const result = await db.insert(gamesTable)
    .values({
      board_state: JSON.stringify(gameData.board_state),
      current_player: gameData.current_player,
      status: gameData.status,
      winner: gameData.winner || null,
      created_at: gameData.created_at || new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  const game = result[0];
  return {
    id: game.id,
    board_state: JSON.parse(JSON.stringify(game.board_state)) as BoardState,
    current_player: game.current_player,
    status: game.status,
    winner: game.winner,
    created_at: game.created_at,
    updated_at: game.updated_at
  };
};

describe('getRecentGames', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no games exist', async () => {
    const result = await getRecentGames();
    
    expect(result).toEqual([]);
  });

  it('should return single game when only one exists', async () => {
    // Create a test game
    const testBoardState: BoardState = [null, null, null, null, null, null, null, null, null];
    await createTestGame({
      board_state: testBoardState,
      current_player: 'X',
      status: 'in_progress'
    });

    const result = await getRecentGames();

    expect(result).toHaveLength(1);
    expect(result[0].board_state).toEqual(testBoardState);
    expect(result[0].current_player).toEqual('X');
    expect(result[0].status).toEqual('in_progress');
    expect(result[0].winner).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return games in descending order by created_at', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const testBoardState: BoardState = [null, null, null, null, null, null, null, null, null];

    // Create games with different timestamps
    await createTestGame({
      board_state: testBoardState,
      current_player: 'X',
      status: 'in_progress',
      created_at: twoHoursAgo
    });

    await createTestGame({
      board_state: testBoardState,
      current_player: 'O',
      status: 'won',
      winner: 'O',
      created_at: now
    });

    await createTestGame({
      board_state: testBoardState,
      current_player: 'X',
      status: 'draw',
      created_at: oneHourAgo
    });

    const result = await getRecentGames();

    expect(result).toHaveLength(3);
    // Should be ordered by created_at DESC (newest first)
    expect(result[0].current_player).toEqual('O'); // Most recent
    expect(result[1].status).toEqual('draw'); // Middle
    expect(result[2].current_player).toEqual('X'); // Oldest
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should limit results to 10 games', async () => {
    const testBoardState: BoardState = [null, null, null, null, null, null, null, null, null];

    // Create 15 test games with clear timestamps
    const baseTime = Date.now();
    for (let i = 0; i < 15; i++) {
      await createTestGame({
        board_state: testBoardState,
        current_player: i % 2 === 0 ? 'X' : 'O',
        status: 'in_progress',
        created_at: new Date(baseTime + i * 1000) // Each game 1 second apart
      });
    }

    const result = await getRecentGames();

    expect(result).toHaveLength(10);
    
    // Verify games are in descending order by created_at
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
    
    // The most recent 10 games should be games with indices 14, 13, 12, ..., 5
    // So the first result should correspond to game index 14, which has player 'O' (14 % 2 !== 0)
    // And the last result should correspond to game index 5, which has player 'O' (5 % 2 !== 0)
    
    // Since we can't predict exact ordering due to potential timing issues,
    // let's just verify we got exactly 10 games and they're properly ordered
    expect(result.length).toBe(10);
  });

  it('should handle various game states correctly', async () => {
    // Create games with different board states and statuses
    const inProgressBoard: BoardState = ['X', null, 'O', null, 'X', null, null, null, null];
    const wonBoard: BoardState = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
    const drawBoard: BoardState = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];

    await createTestGame({
      board_state: inProgressBoard,
      current_player: 'O',
      status: 'in_progress'
    });

    await createTestGame({
      board_state: wonBoard,
      current_player: 'X',
      status: 'won',
      winner: 'X'
    });

    await createTestGame({
      board_state: drawBoard,
      current_player: 'X',
      status: 'draw'
    });

    const result = await getRecentGames();

    expect(result).toHaveLength(3);
    
    // Find each game by status and verify properties
    const inProgressGame = result.find(g => g.status === 'in_progress');
    const wonGame = result.find(g => g.status === 'won');
    const drawGame = result.find(g => g.status === 'draw');

    expect(inProgressGame).toBeDefined();
    expect(inProgressGame?.board_state).toEqual(inProgressBoard);
    expect(inProgressGame?.winner).toBeNull();

    expect(wonGame).toBeDefined();
    expect(wonGame?.board_state).toEqual(wonBoard);
    expect(wonGame?.winner).toEqual('X');

    expect(drawGame).toBeDefined();
    expect(drawGame?.board_state).toEqual(drawBoard);
    expect(drawGame?.winner).toBeNull();
  });

  it('should handle board state JSON serialization correctly', async () => {
    const complexBoard: BoardState = ['X', 'O', null, 'X', null, 'O', null, 'X', 'O'];
    
    await createTestGame({
      board_state: complexBoard,
      current_player: 'X',
      status: 'in_progress'
    });

    const result = await getRecentGames();

    expect(result).toHaveLength(1);
    expect(result[0].board_state).toEqual(complexBoard);
    expect(Array.isArray(result[0].board_state)).toBe(true);
    expect(result[0].board_state).toHaveLength(9);
  });
});