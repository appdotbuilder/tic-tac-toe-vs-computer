import { describe, expect, it } from 'bun:test';
import { checkWinCondition } from '../handlers/check_win_condition';
import { type BoardState } from '../schema';

describe('checkWinCondition', () => {
  // Helper to create an empty board
  const emptyBoard = (): BoardState => Array(9).fill(null) as BoardState;

  describe('Row wins', () => {
    it('should detect X win in first row', () => {
      const board: BoardState = [
        'X', 'X', 'X',
        'O', 'O', null,
        null, null, null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('X');
      expect(result.isGameOver).toBe(true);
    });

    it('should detect O win in second row', () => {
      const board: BoardState = [
        'X', 'X', null,
        'O', 'O', 'O',
        'X', null, null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('O');
      expect(result.isGameOver).toBe(true);
    });

    it('should detect X win in third row', () => {
      const board: BoardState = [
        'O', 'O', null,
        'O', 'X', null,
        'X', 'X', 'X'
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('X');
      expect(result.isGameOver).toBe(true);
    });
  });

  describe('Column wins', () => {
    it('should detect X win in first column', () => {
      const board: BoardState = [
        'X', 'O', 'O',
        'X', 'O', null,
        'X', null, null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('X');
      expect(result.isGameOver).toBe(true);
    });

    it('should detect O win in second column', () => {
      const board: BoardState = [
        'X', 'O', 'X',
        'X', 'O', null,
        null, 'O', null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('O');
      expect(result.isGameOver).toBe(true);
    });

    it('should detect X win in third column', () => {
      const board: BoardState = [
        'O', 'O', 'X',
        null, 'O', 'X',
        null, null, 'X'
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('X');
      expect(result.isGameOver).toBe(true);
    });
  });

  describe('Diagonal wins', () => {
    it('should detect X win in main diagonal (top-left to bottom-right)', () => {
      const board: BoardState = [
        'X', 'O', 'O',
        'O', 'X', null,
        null, null, 'X'
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('X');
      expect(result.isGameOver).toBe(true);
    });

    it('should detect O win in anti-diagonal (top-right to bottom-left)', () => {
      const board: BoardState = [
        'X', 'X', 'O',
        'X', 'O', null,
        'O', null, null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('O');
      expect(result.isGameOver).toBe(true);
    });
  });

  describe('Draw conditions', () => {
    it('should detect draw when board is full with no winner', () => {
      const board: BoardState = [
        'X', 'O', 'X',
        'O', 'O', 'X',
        'O', 'X', 'O'
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe(null);
      expect(result.isGameOver).toBe(true);
    });

    it('should detect another draw scenario', () => {
      const board: BoardState = [
        'X', 'X', 'O',
        'O', 'O', 'X',
        'X', 'O', 'X'
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe(null);
      expect(result.isGameOver).toBe(true);
    });
  });

  describe('Game in progress', () => {
    it('should return no winner and game not over for empty board', () => {
      const board = emptyBoard();

      const result = checkWinCondition(board);
      expect(result.winner).toBe(null);
      expect(result.isGameOver).toBe(false);
    });

    it('should return no winner and game not over for partially filled board', () => {
      const board: BoardState = [
        'X', 'O', null,
        'O', 'X', null,
        null, null, null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe(null);
      expect(result.isGameOver).toBe(false);
    });

    it('should return no winner and game not over when no winning pattern exists', () => {
      const board: BoardState = [
        'X', 'O', 'X',
        'O', 'X', null,
        'O', null, null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe(null);
      expect(result.isGameOver).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle single move scenarios', () => {
      const board: BoardState = [
        'X', null, null,
        null, null, null,
        null, null, null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe(null);
      expect(result.isGameOver).toBe(false);
    });

    it('should prioritize win over draw when board is full but has a winner', () => {
      const board: BoardState = [
        'X', 'X', 'X',
        'O', 'O', 'X',
        'O', 'X', 'O'
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe('X');
      expect(result.isGameOver).toBe(true);
    });

    it('should handle mixed player scenarios correctly', () => {
      const board: BoardState = [
        'O', 'X', 'O',
        'X', 'X', 'O',
        'X', 'O', null
      ];

      const result = checkWinCondition(board);
      expect(result.winner).toBe(null);
      expect(result.isGameOver).toBe(false);
    });
  });
});