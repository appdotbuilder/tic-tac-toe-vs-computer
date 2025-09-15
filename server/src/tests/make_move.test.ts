import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type MakeMoveInput, type BoardState } from '../schema';
import { makeMove } from '../handlers/make_move';
import { eq } from 'drizzle-orm';

// Helper function to create a test game
async function createTestGame(boardState: BoardState = Array(9).fill(null), currentPlayer: 'X' | 'O' = 'X') {
  const result = await db.insert(gamesTable)
    .values({
      board_state: boardState,
      current_player: currentPlayer,
      status: 'in_progress',
      winner: null
    })
    .returning()
    .execute();
  
  return result[0];
}

describe('makeMove', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process a human move and generate computer response', async () => {
    // Create a new game
    const game = await createTestGame();
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 4 // Center position
    };

    const result = await makeMove(input);

    // Verify response structure
    expect(result.game_over).toBe(false);
    expect(result.human_move).toEqual({
      player: 'X',
      position: 4
    });
    expect(result.computer_move).toBeDefined();
    expect(result.computer_move!.player).toBe('O');
    expect(result.message).toBe('Move processed successfully');
    
    // Verify game state
    expect(result.game.id).toBe(game.id);
    expect(result.game.status).toBe('in_progress');
    expect(result.game.board_state[4]).toBe('X');
    expect(result.game.board_state[result.computer_move!.position]).toBe('O');
    expect(result.game.current_player).toBe('O'); // Should switch to computer's turn
  });

  it('should detect human win condition', async () => {
    // Create a board where human (X) can win on next move
    const boardState: BoardState = [
      'X', 'X', null,  // X can win by playing position 2
      'O', 'O', null,
      null, null, null
    ];
    const game = await createTestGame(boardState, 'X');
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 2 // Winning move
    };

    const result = await makeMove(input);

    expect(result.game_over).toBe(true);
    expect(result.game.status).toBe('won');
    expect(result.game.winner).toBe('X');
    expect(result.computer_move).toBeNull();
    expect(result.message).toBe('Player X wins!');
  });

  it('should detect draw condition', async () => {
    // Create a board that will result in a draw after human move
    const boardState: BoardState = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', null  // Last move results in draw (no wins possible)
    ];
    const game = await createTestGame(boardState, 'X');
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 8 // Last position
    };

    const result = await makeMove(input);

    expect(result.game_over).toBe(true);
    expect(result.game.status).toBe('draw');
    expect(result.game.winner).toBeNull();
    expect(result.computer_move).toBeNull();
    expect(result.message).toBe('Game ended in a draw!');
  });

  it('should detect computer win after computer move', async () => {
    // Create a board where computer (O) can win after human move
    const boardState: BoardState = [
      'X', 'X', 'O',
      'O', 'O', null,  // O can win by playing position 5
      'X', null, null
    ];
    const game = await createTestGame(boardState, 'X');
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 7 // Human plays position 7
    };

    const result = await makeMove(input);

    expect(result.game_over).toBe(true);
    expect(result.game.status).toBe('won');
    expect(result.game.winner).toBe('O');
    expect(result.computer_move!.position).toBe(5); // Computer wins at position 5
    expect(result.message).toBe('Computer (O) wins!');
  });

  it('should prevent computer from losing when possible', async () => {
    // Create a board where human (X) is about to win
    const boardState: BoardState = [
      'X', 'X', null,  // X threatens to win at position 2
      'O', null, null,
      null, null, null
    ];
    const game = await createTestGame(boardState, 'X');
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 6 // Human plays elsewhere
    };

    const result = await makeMove(input);

    // Computer should block the winning move at position 2
    expect(result.computer_move!.position).toBe(2);
    expect(result.game.board_state[2]).toBe('O');
    expect(result.game_over).toBe(false);
  });

  it('should save move to database', async () => {
    const game = await createTestGame();
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 0
    };

    await makeMove(input);

    // Verify database was updated
    const updatedGames = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, game.id))
      .execute();

    expect(updatedGames).toHaveLength(1);
    const updatedGame = updatedGames[0];
    const boardState = updatedGame.board_state as BoardState;
    
    expect(boardState[0]).toBe('X'); // Human move
    expect(boardState.filter(cell => cell === 'O')).toHaveLength(1); // Computer move
    expect(updatedGame.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent game', async () => {
    const input: MakeMoveInput = {
      game_id: 999,
      position: 0
    };

    await expect(makeMove(input)).rejects.toThrow(/Game with id 999 not found/i);
  });

  it('should throw error for finished game', async () => {
    // Create a finished game
    const result = await db.insert(gamesTable)
      .values({
        board_state: Array(9).fill(null),
        current_player: 'X',
        status: 'won',
        winner: 'X'
      })
      .returning()
      .execute();

    const input: MakeMoveInput = {
      game_id: result[0].id,
      position: 0
    };

    await expect(makeMove(input)).rejects.toThrow(/Game is not in progress/i);
  });

  it('should throw error for occupied position', async () => {
    const boardState: BoardState = [
      'X', null, null,
      null, null, null,
      null, null, null
    ];
    const game = await createTestGame(boardState);
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 0 // Position already occupied by X
    };

    await expect(makeMove(input)).rejects.toThrow(/Position is already occupied/i);
  });

  it('should work with O as human player', async () => {
    // Create game where O is the current player
    const game = await createTestGame(Array(9).fill(null), 'O');
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 4
    };

    const result = await makeMove(input);

    expect(result.human_move!.player).toBe('O');
    expect(result.computer_move!.player).toBe('X');
    expect(result.game.board_state[4]).toBe('O');
  });

  it('should handle edge case of nearly full board', async () => {
    // Create a board with only 2 empty positions
    const boardState: BoardState = [
      'X', 'O', 'X',
      'O', 'X', 'O',
      'O', null, null  // Only positions 7 and 8 are empty
    ];
    const game = await createTestGame(boardState, 'X');
    
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 7
    };

    const result = await makeMove(input);

    // Computer should make the only remaining move
    expect(result.computer_move!.position).toBe(8);
    expect(result.game.board_state[7]).toBe('X');
    expect(result.game.board_state[8]).toBe('O');
    
    // Should be a draw since no winning combinations possible
    expect(result.game_over).toBe(true);
    expect(result.game.status).toBe('draw');
  });
});