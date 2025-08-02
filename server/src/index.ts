
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

// Database seeding imports
import { db } from './db';
import { 
  gamesTable, 
  gameCategoriesTable, 
  gameCategoryRelationsTable, 
  songsTable,
  songRatingsTable 
} from './db/schema';

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

// Database seeding functions
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');
  
  try {
    // First, create game categories
    console.log('Creating game categories...');
    const categories = await db.insert(gameCategoriesTable)
      .values([
        {
          name: 'Strategy',
          description: 'Games that require strategic thinking and long-term planning'
        },
        {
          name: 'Family',
          description: 'Games suitable for players of all ages and families'
        },
        {
          name: 'Card Game',
          description: 'Games primarily played with cards'
        },
        {
          name: 'Cooperative',
          description: 'Games where players work together towards a common goal'
        },
        {
          name: 'Euro Game',
          description: 'European-style strategy games with indirect player interaction'
        },
        {
          name: 'Worker Placement',
          description: 'Games where players place workers to take actions'
        }
      ])
      .returning()
      .execute();

    console.log(`✅ Created ${categories.length} categories`);

    // Create popular board games with realistic BGG data
    console.log('Creating board games...');
    const games = await db.insert(gamesTable)
      .values([
        {
          name: 'Ticket to Ride',
          description: 'A cross-country train adventure where players collect train cards to claim railway routes connecting cities across North America.',
          rules_text: `Ticket to Ride is a railway-themed German-style board game designed by Alan R. Moon. Players collect cards of various types of train cars they then use to claim railway routes in North America. The longer the routes, the more points they earn. Additional points come to those who fulfill Destination Tickets – goal cards that connect distant cities; and to the player who builds the longest continuous route. The tension comes from being forced to balance greed – adding more cards to your hand, and fear – losing a critical route to a competitor.

Setup: Each player takes a set of 45 colored train pieces and the corresponding scoring marker. Give each player 4 train car cards to start. Place 5 train car cards face up next to the draw pile. Each player gets 3 destination tickets and must keep at least 2.

On a turn, a player must perform exactly one of these actions:
1. Draw Train Car Cards - Take 2 train car cards from the face-up display or the draw pile
2. Claim a Route - Play a set of train car cards to claim a route on the board
3. Draw Destination Tickets - Take 3 destination tickets and keep at least 1

The game ends when any player has 2 or fewer train pieces left. Players reveal their destination tickets and score points for completed routes and fulfilled destinations, losing points for unfulfilled destinations.`,
          min_players: 2,
          max_players: 5,
          playtime_minutes: 60,
          age_rating: 8,
          complexity_rating: '1.84',
          bgg_id: 9209,
          bgg_rating: '7.4',
          bgg_rank: 111,
          amazon_link: 'https://amazon.com/Ticket-Ride-Board-Game/dp/B0009MRZK0',
          bol_link: 'https://bol.com/nl/p/ticket-to-ride/9200000023456789',
          youtube_tutorial_url: 'https://youtube.com/watch?v=qHmf1bau9xQ',
          cover_image_url: 'https://picsum.photos/seed/tickettoride/300/300'
        },
        {
          name: 'Pandemic',
          description: 'A cooperative board game where players work as a team of specialists trying to treat infections around the world while gathering resources for cures.',
          rules_text: `In Pandemic, several virulent diseases have broken out simultaneously all over the world! The players are disease-fighting specialists whose mission is to treat disease hotspots while researching cures for each of four plagues before they get out of hand.

The players must work together, playing to their characters' strengths and planning their strategy before the diseases overwhelm the world with ever-increasing outbreaks. For example, the Operations Expert can build research stations which are needed to find cures for the diseases and which allow for greater mobility between cities; the Scientist needs only four cards of a particular disease type to cure it instead of the normal five; and the Medic removes all cubes, not just one, of a particular color when doing the Treat Disease action.

Each player takes a different role with unique capabilities to improve the team's chances. The players can win by discovering cures for all four diseases. The players lose if any of several conditions are met: 8 outbreaks occur, not enough disease cubes can be placed on the board, or not enough cards can be drawn from the Player Deck.

The game uses innovative mechanics where the threat increases each turn by drawing cards from the bottom of the infection deck and placing disease cubes on those cities, creating hotspots of infection that can trigger outbreaks.`,
          min_players: 2,
          max_players: 4,
          playtime_minutes: 45,
          age_rating: 8,
          complexity_rating: '2.40',
          bgg_id: 30549,
          bgg_rating: '7.6',
          bgg_rank: 54,
          amazon_link: 'https://amazon.com/Z-Man-Games-Pandemic-Board/dp/B00A2HD40E',
          bol_link: 'https://bol.com/nl/p/pandemic-board-game/9200000045678901',
          youtube_tutorial_url: 'https://youtube.com/watch?v=ytK1zB8rf4E',
          cover_image_url: 'https://picsum.photos/seed/pandemic/300/300'
        },
        {
          name: 'Catan',
          description: 'Players try to be the dominant force on the island of Catan by building settlements, cities, and roads. Each turn dice are rolled to determine what resources the island produces.',
          rules_text: `In CATAN (formerly The Settlers of Catan), players try to be the dominant force on the island of Catan by building settlements, cities, and roads. On each turn dice are rolled to determine what resources the island produces. Players collect these resources to build up their civilizations to get to 10 victory points and win the game.

Setup: The board is randomly set up with hexagonal terrain tiles and number tokens. Each player places two settlements and two roads. Players collect starting resources based on their second settlement.

On your turn: Roll two dice. All players collect resources from terrain hexes adjacent to their settlements/cities that match the dice roll. Then the active player may trade resources and build settlements, cities, roads, or development cards.

Building costs:
- Road: 1 Brick + 1 Lumber
- Settlement: 1 Brick + 1 Lumber + 1 Grain + 1 Wool
- City: 2 Grain + 3 Ore (replaces a settlement)
- Development Card: 1 Grain + 1 Ore + 1 Wool

Victory points come from settlements (1 point), cities (2 points), longest road (2 points), largest army (2 points), and certain development cards (1 point each).

Special rules: If a 7 is rolled, players with more than 7 cards discard half, and the robber moves to block a hex and steal from an adjacent player.`,
          min_players: 3,
          max_players: 4,
          playtime_minutes: 75,
          age_rating: 10,
          complexity_rating: '2.33',
          bgg_id: 13,
          bgg_rating: '7.1',
          bgg_rank: 239,
          amazon_link: 'https://amazon.com/Catan-Board-Game-Base/dp/B00U26V4VQ',
          bol_link: 'https://bol.com/nl/p/catan-board-game/9200000067890123',
          youtube_tutorial_url: 'https://youtube.com/watch?v=o3WJsnDnbUc',
          cover_image_url: 'https://picsum.photos/seed/catan/300/300'
        },
        {
          name: 'Wingspan',
          description: 'A competitive, medium-weight, card-driven, engine-building board game where players are bird enthusiasts seeking to discover and attract the best birds to their network of wildlife preserves.',
          rules_text: `Wingspan is a competitive, medium-weight, card-driven, engine-building board game from Stonemaier Games. You are bird enthusiasts—researchers, bird watchers, ornithologists, and collectors—seeking to discover and attract the best birds to your network of wildlife preserves. Each bird extends a chain of powerful combinations in one of your habitats (actions).

The winner is the player with the most end-of-round goals, bird cards, bonus cards, egg tokens, cached food tokens, and tucked cards.

Each player starts with a random player mat (one side of which is used for a more advanced variant), 5 bird cards, 2 bonus cards (keep 1), and 5 food tokens.

On your turn, you select one of four actions:
1. Play a bird from your hand - Pay its food cost, then place it in your forest, grassland, or wetland habitat
2. Gain food - Activate forest bird powers, then gain food using dice in the birdfeeder
3. Lay eggs - Activate grassland bird powers, then lay eggs on your birds
4. Draw bird cards - Activate wetland bird powers, then draw bird cards

Each habitat has different bird powers that activate when you take that habitat's action. The more birds you have in a habitat, the more powerful the action becomes. Birds also have end-of-round goals that provide bonus points.

The game lasts 4 rounds, with fewer actions available each round. Players score points from birds, bonus cards, end-of-round goals, eggs, cached food, and tucked cards.`,
          min_players: 1,
          max_players: 5,
          playtime_minutes: 70,
          age_rating: 10,
          complexity_rating: '2.44',
          bgg_id: 266192,
          bgg_rating: '8.1',
          bgg_rank: 25,
          amazon_link: 'https://amazon.com/Stonemaier-Games-Wingspan-Board-Game/dp/B07YQ641NQ',
          bol_link: 'https://bol.com/nl/p/wingspan-board-game/9200000089012345',
          youtube_tutorial_url: 'https://youtube.com/watch?v=xcQ77lmOzog',
          cover_image_url: 'https://picsum.photos/seed/wingspan/300/300'
        }
      ])
      .returning()
      .execute();

    console.log(`✅ Created ${games.length} games`);

    // Create game-category relationships
    console.log('Creating game-category relationships...');
    const gameCategories = await db.insert(gameCategoryRelationsTable)
      .values([
        // Ticket to Ride - Family, Strategy
        { game_id: games[0].id, category_id: categories.find(c => c.name === 'Family')!.id },
        { game_id: games[0].id, category_id: categories.find(c => c.name === 'Strategy')!.id },
        
        // Pandemic - Cooperative, Strategy
        { game_id: games[1].id, category_id: categories.find(c => c.name === 'Cooperative')!.id },
        { game_id: games[1].id, category_id: categories.find(c => c.name === 'Strategy')!.id },
        
        // Catan - Strategy, Family
        { game_id: games[2].id, category_id: categories.find(c => c.name === 'Strategy')!.id },
        { game_id: games[2].id, category_id: categories.find(c => c.name === 'Family')!.id },
        
        // Wingspan - Strategy, Euro Game
        { game_id: games[3].id, category_id: categories.find(c => c.name === 'Strategy')!.id },
        { game_id: games[3].id, category_id: categories.find(c => c.name === 'Euro Game')!.id }
      ])
      .returning()
      .execute();

    console.log(`✅ Created ${gameCategories.length} game-category relationships`);

    // Create songs for each game
    console.log('Creating songs...');
    const songs = [];

    // Songs for Ticket to Ride
    const ticketToRideSongs = await db.insert(songsTable)
      .values([
        {
          game_id: games[0].id,
          title: 'All Aboard the Victory Train',
          description: 'An upbeat folk song celebrating the journey across America by rail',
          suno_track_id: 'suno_ttr_001',
          audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
          duration_seconds: 180,
          genre: 'Folk'
        },
        {
          game_id: games[0].id,
          title: 'Railway Blues',
          description: 'A bluesy tune about the competitive nature of claiming routes',
          suno_track_id: 'suno_ttr_002',
          audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-04.mp3',
          duration_seconds: 165,
          genre: 'Blues'
        },
        {
          game_id: games[0].id,
          title: 'Coast to Coast Express',
          description: 'An energetic country song about connecting distant cities',
          suno_track_id: 'suno_ttr_003',
          audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-03.mp3',
          duration_seconds: 195,
          genre: 'Country'
        }
      ])
      .returning()
      .execute();

    // Songs for Pandemic
    const pandemicSongs = await db.insert(songsTable)
      .values([
        {
          game_id: games[1].id,
          title: 'Heroes in Hazmat',
          description: 'An epic orchestral piece about the brave disease fighters',
          suno_track_id: 'suno_pandemic_001',
          audio_url: 'https://www.soundjay.com/misc/sounds/clock-ticking-3.mp3',
          duration_seconds: 210,
          genre: 'Orchestral'
        },
        {
          game_id: games[1].id,
          title: 'Outbreak Alert',
          description: 'A tense electronic track capturing the urgency of stopping disease spread',
          suno_track_id: 'suno_pandemic_002',
          audio_url: 'https://www.soundjay.com/misc/sounds/clock-ticking-2.mp3',
          duration_seconds: 155,
          genre: 'Electronic'
        },
        {
          game_id: games[1].id,
          title: 'Cure Discovery',
          description: 'A triumphant anthem celebrating scientific breakthrough',
          suno_track_id: 'suno_pandemic_003',
          audio_url: 'https://www.soundjay.com/misc/sounds/clock-ticking-1.mp3',
          duration_seconds: 175,
          genre: 'Cinematic'
        }
      ])
      .returning()
      .execute();

    // Songs for Catan
    const catanSongs = await db.insert(songsTable)
      .values([
        {
          game_id: games[2].id,
          title: 'Settlers of the New World',
          description: 'A medieval-inspired ballad about building civilization',
          suno_track_id: 'suno_catan_001',
          audio_url: 'https://www.soundjay.com/misc/sounds/magic-chime-02.mp3',
          duration_seconds: 190,
          genre: 'Medieval'
        },
        {
          game_id: games[2].id,
          title: 'The Robber\'s March',
          description: 'A dark, mysterious tune representing the dreaded robber',
          suno_track_id: 'suno_catan_002',
          audio_url: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3',
          duration_seconds: 140,
          genre: 'Dark Ambient'
        },
        {
          game_id: games[2].id,
          title: 'Longest Road Celebration',
          description: 'A victorious march celebrating the longest road achievement',
          suno_track_id: 'suno_catan_003',
          audio_url: 'https://www.soundjay.com/misc/sounds/magic-chime-03.mp3',
          duration_seconds: 160,
          genre: 'March'
        }
      ])
      .returning()
      .execute();

    // Songs for Wingspan
    const wingspanSongs = await db.insert(songsTable)
      .values([
        {
          game_id: games[3].id,
          title: 'Avian Symphony',
          description: 'A beautiful orchestral piece featuring bird calls and nature sounds',
          suno_track_id: 'suno_wingspan_001',
          audio_url: 'https://www.soundjay.com/misc/sounds/bird-2.mp3',
          duration_seconds: 220,
          genre: 'Classical'
        },
        {
          game_id: games[3].id,
          title: 'Wingspan Waltz',
          description: 'An elegant waltz celebrating the grace of birds in flight',
          suno_track_id: 'suno_wingspan_002',
          audio_url: 'https://www.soundjay.com/misc/sounds/bird-1.mp3',
          duration_seconds: 185,
          genre: 'Waltz'
        },
        {
          game_id: games[3].id,
          title: 'Engine Building Blues',
          description: 'A smooth jazz piece about building your bird engine',
          suno_track_id: 'suno_wingspan_003',
          audio_url: 'https://www.soundjay.com/misc/sounds/bird-3.mp3',
          duration_seconds: 200,
          genre: 'Jazz'
        }
      ])
      .returning()
      .execute();

    songs.push(...ticketToRideSongs, ...pandemicSongs, ...catanSongs, ...wingspanSongs);
    console.log(`✅ Created ${songs.length} songs`);

    // Create some mock song ratings
    console.log('Creating mock song ratings...');
    const mockRatings = [];
    
    // Add ratings for first few songs to demonstrate the feature
    for (let i = 0; i < Math.min(6, songs.length); i++) {
      const song = songs[i];
      // Add 3-5 ratings per song with varied IPs and ratings
      const numRatings = Math.floor(Math.random() * 3) + 3; // 3-5 ratings
      
      for (let j = 0; j < numRatings; j++) {
        mockRatings.push({
          song_id: song.id,
          user_ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          rating: Math.floor(Math.random() * 5) + 1 // 1-5 stars
        });
      }
    }

    const ratings = await db.insert(songRatingsTable)
      .values(mockRatings)
      .returning()
      .execute();

    console.log(`✅ Created ${ratings.length} song ratings`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Return summary
    return {
      categories: categories.length,
      games: games.length,
      gameCategories: gameCategories.length,
      songs: songs.length,
      ratings: ratings.length
    };

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Function to check if database is already seeded
const isDatabaseSeeded = async (): Promise<boolean> => {
  try {
    const games = await db.select().from(gamesTable).limit(1).execute();
    return games.length > 0;
  } catch (error) {
    console.error('Error checking if database is seeded:', error);
    return false;
  }
};

// Function to seed only if not already seeded
const seedIfEmpty = async () => {
  const alreadySeeded = await isDatabaseSeeded();
  if (!alreadySeeded) {
    console.log('Database is empty, running seed...');
    return await seedDatabase();
  } else {
    console.log('Database already contains data, skipping seed.');
    return null;
  }
};

async function start() {
  try {
    // Seed database if empty
    await seedIfEmpty();
  } catch (error) {
    console.error('Failed to seed database:', error);
    // Continue starting server even if seeding fails
  }

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
  console.log(`🎮 Board Game Browser TRPC server listening at port: ${port}`);
}

start();
