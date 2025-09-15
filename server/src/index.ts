import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createGameInputSchema, 
  makeMoveInputSchema, 
  getGameInputSchema 
} from './schema';

// Import handlers
import { createGame } from './handlers/create_game';
import { makeMove } from './handlers/make_move';
import { getGame } from './handlers/get_game';
import { getRecentGames } from './handlers/get_recent_games';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new Tic-Tac-Toe game
  createGame: publicProcedure
    .input(createGameInputSchema)
    .mutation(({ input }) => createGame(input)),

  // Make a move in an existing game
  makeMove: publicProcedure
    .input(makeMoveInputSchema)
    .mutation(({ input }) => makeMove(input)),

  // Get a specific game by ID
  getGame: publicProcedure
    .input(getGameInputSchema)
    .query(({ input }) => getGame(input)),

  // Get recent games
  getRecentGames: publicProcedure
    .query(() => getRecentGames()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Tic-Tac-Toe server listening at port: ${port}`);
}

start();