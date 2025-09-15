import { describe, expect, it } from 'bun:test';
import { getComputerMove } from '../handlers/get_computer_move';
import { type BoardState, type Player } from '../schema';

describe('getComputerMove', () => {
  it('should win when computer can win in one move - row', () => {
    // X _ X (computer can win at position 1)
    // _ O _
    // O _ _
    const board: BoardState = [
      'X', null, 'X',
      null, 'O', null,
      'O', null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(1);
  });

  it('should win when computer can win in one move - column', () => {
    // X O _
    // X _ O
    // _ _ _ (computer can win at position 6)
    const board: BoardState = [
      'X', 'O', null,
      'X', null, 'O',
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(6);
  });

  it('should win when computer can win in one move - diagonal', () => {
    // X O _
    // O X _
    // _ _ _ (computer can win at position 8)
    const board: BoardState = [
      'X', 'O', null,
      'O', 'X', null,
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(8);
  });

  it('should block human from winning - row', () => {
    // O _ O (computer should block at position 1)
    // X _ _
    // X _ _
    const board: BoardState = [
      'O', null, 'O',
      'X', null, null,
      'X', null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(1);
  });

  it('should block human from winning - column', () => {
    // O X _
    // O _ X
    // _ _ _ (computer should block at position 6)
    const board: BoardState = [
      'O', 'X', null,
      'O', null, 'X',
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(6);
  });

  it('should block human from winning - diagonal', () => {
    // O X _
    // X O _
    // _ _ _ (computer should block at position 8)
    const board: BoardState = [
      'O', 'X', null,
      'X', 'O', null,
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(8);
  });

  it('should take center when available and no immediate threats', () => {
    // X _ _
    // _ _ _
    // _ _ O (computer should take center at position 4)
    const board: BoardState = [
      'X', null, null,
      null, null, null,
      null, null, 'O'
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(4);
  });

  it('should take corner when center is occupied', () => {
    // _ _ _
    // _ O _
    // _ _ _ (computer should take a corner)
    const board: BoardState = [
      null, null, null,
      null, 'O', null,
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect([0, 2, 6, 8]).toContain(move);
  });

  it('should take side when only sides are available', () => {
    // X O X
    // _ X _
    // O _ O (computer should take a side position)
    const board: BoardState = [
      'X', 'O', 'X',
      null, 'X', null,
      'O', null, 'O'
    ];
    
    const move = getComputerMove(board, 'X');
    expect([3, 5, 7]).toContain(move);
  });

  it('should work correctly when computer is O player', () => {
    // O _ O (computer playing as O can win at position 1)
    // X _ _
    // X _ _
    const board: BoardState = [
      'O', null, 'O',
      'X', null, null,
      'X', null, null
    ];
    
    const move = getComputerMove(board, 'O');
    expect(move).toBe(1);
  });

  it('should prioritize winning over blocking', () => {
    // X X _ (computer can win at position 2, human can win at position 7)
    // _ _ _
    // O O _ 
    const board: BoardState = [
      'X', 'X', null,
      null, null, null,
      'O', 'O', null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(2); // Should win instead of blocking
  });

  it('should handle empty board by taking center', () => {
    const board: BoardState = [
      null, null, null,
      null, null, null,
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(4);
  });

  it('should handle nearly full board', () => {
    // X O X
    // O X O
    // O _ X (only position 7 is available)
    const board: BoardState = [
      'X', 'O', 'X',
      'O', 'X', 'O',
      'O', null, 'X'
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(7);
  });

  it('should correctly identify multiple winning combinations', () => {
    // X X _ (computer can win at position 2 - row)
    // _ _ _
    // _ _ _ 
    const board: BoardState = [
      'X', 'X', null,
      null, null, null,
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(2);
  });

  it('should prioritize blocking over strategic positioning', () => {
    // O O _ (human can win, computer should block at position 2)
    // _ _ _
    // _ _ _
    const board: BoardState = [
      'O', 'O', null,
      null, null, null,
      null, null, null
    ];
    
    const move = getComputerMove(board, 'X');
    expect(move).toBe(2);
  });
});