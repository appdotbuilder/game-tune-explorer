
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  createGameInputSchema, 
  updateGameInputSchema, 
  gameSearchInputSchema,
  createSongInputSchema,
  rateSongInputSchema,
  createCategoryInputSchema
} from './schema';

// Import handlers
import { createGame } from './handlers/create_game';
import { getGames } from './handlers/get_games';
import { getGameById } from './handlers/get_game_by_id';
import { searchGames } from './handlers/search_games';
import { updateGame } from './handlers/update_game';
import { deleteGame } from './handlers/delete_game';
import { createSong } from './handlers/create_song';
import { getSongsByGame } from './handlers/get_songs_by_game';
import { rateSong } from './handlers/rate_song';
import { getSongRatings } from './handlers/get_song_ratings';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { getFeaturedGames } from './handlers/get_featured_games';
import { updateBggStats } from './handlers/update_bgg_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Game management routes
  createGame: publicProcedure
    .input(createGameInputSchema)
    .mutation(({ input }) => createGame(input)),

  getGames: publicProcedure
    .query(() => getGames()),

  getGameById: publicProcedure
    .input(z.number())
    .query(({ input }) => getGameById(input)),

  searchGames: publicProcedure
    .input(gameSearchInputSchema)
    .query(({ input }) => searchGames(input)),

  updateGame: publicProcedure
    .input(updateGameInputSchema)
    .mutation(({ input }) => updateGame(input)),

  deleteGame: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteGame(input)),

  getFeaturedGames: publicProcedure
    .query(() => getFeaturedGames()),

  updateBggStats: publicProcedure
    .input(z.number())
    .mutation(({ input }) => updateBggStats(input)),

  // Song management routes
  createSong: publicProcedure
    .input(createSongInputSchema)
    .mutation(({ input }) => createSong(input)),

  getSongsByGame: publicProcedure
    .input(z.number())
    .query(({ input }) => getSongsByGame(input)),

  rateSong: publicProcedure
    .input(rateSongInputSchema)
    .mutation(({ input }) => rateSong(input)),

  getSongRatings: publicProcedure
    .input(z.number())
    .query(({ input }) => getSongRatings(input)),

  // Category management routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),
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
  console.log(`Board Game Browser TRPC server listening at port: ${port}`);
}

start();
