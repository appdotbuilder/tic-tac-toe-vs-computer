import { serial, text, pgTable, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for the database
export const playerEnum = pgEnum('player', ['X', 'O']);
export const gameStatusEnum = pgEnum('game_status', ['in_progress', 'won', 'draw']);

export const gamesTable = pgTable('games', {
  id: serial('id').primaryKey(),
  board_state: jsonb('board_state').notNull(), // Array of 9 positions (null or 'X'/'O')
  current_player: playerEnum('current_player').notNull(),
  status: gameStatusEnum('status').notNull(),
  winner: playerEnum('winner'), // Nullable - only set when game is won
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Game = typeof gamesTable.$inferSelect; // For SELECT operations
export type NewGame = typeof gamesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { games: gamesTable };