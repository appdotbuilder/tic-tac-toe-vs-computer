import { z } from 'zod';

// Player enum for X and O marks
export const playerSchema = z.enum(['X', 'O']);
export type Player = z.infer<typeof playerSchema>;

// Game status enum
export const gameStatusSchema = z.enum(['in_progress', 'won', 'draw']);
export type GameStatus = z.infer<typeof gameStatusSchema>;

// Position schema for board coordinates (0-8)
export const positionSchema = z.number().int().min(0).max(8);
export type Position = z.infer<typeof positionSchema>;

// Board state schema - array of 9 positions (null means empty)
export const boardStateSchema = z.array(playerSchema.nullable()).length(9);
export type BoardState = z.infer<typeof boardStateSchema>;

// Game schema
export const gameSchema = z.object({
  id: z.number(),
  board_state: boardStateSchema,
  current_player: playerSchema,
  status: gameStatusSchema,
  winner: playerSchema.nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Game = z.infer<typeof gameSchema>;

// Input schema for creating a new game
export const createGameInputSchema = z.object({
  human_player: playerSchema.optional().default('X') // Human player chooses X or O, defaults to X
});

export type CreateGameInput = z.infer<typeof createGameInputSchema>;

// Input schema for making a move
export const makeMoveInputSchema = z.object({
  game_id: z.number(),
  position: positionSchema
});

export type MakeMoveInput = z.infer<typeof makeMoveInputSchema>;

// Response schema for game moves
export const gameMoveResponseSchema = z.object({
  game: gameSchema,
  human_move: z.object({
    player: playerSchema,
    position: positionSchema
  }).nullable(),
  computer_move: z.object({
    player: playerSchema,
    position: positionSchema
  }).nullable(),
  game_over: z.boolean(),
  message: z.string()
});

export type GameMoveResponse = z.infer<typeof gameMoveResponseSchema>;

// Input schema for getting a specific game
export const getGameInputSchema = z.object({
  game_id: z.number()
});

export type GetGameInput = z.infer<typeof getGameInputSchema>;