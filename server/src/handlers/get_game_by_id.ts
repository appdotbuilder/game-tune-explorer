
import { db } from '../db';
import { gamesTable, songsTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { type GameWithSongs } from '../schema';
import { eq } from 'drizzle-orm';

export async function getGameById(id: number): Promise<GameWithSongs | null> {
  try {
    // First, get the game with its categories
    const gameWithCategories = await db
      .select({
        game: gamesTable,
        category: gameCategoriesTable,
      })
      .from(gamesTable)
      .leftJoin(gameCategoryRelationsTable, eq(gamesTable.id, gameCategoryRelationsTable.game_id))
      .leftJoin(gameCategoriesTable, eq(gameCategoryRelationsTable.category_id, gameCategoriesTable.id))
      .where(eq(gamesTable.id, id))
      .execute();

    // If no game found, return null
    if (gameWithCategories.length === 0) {
      return null;
    }

    // Get all songs for this game
    const songs = await db
      .select()
      .from(songsTable)
      .where(eq(songsTable.game_id, id))
      .execute();

    // Extract the game data (same across all rows)
    const gameData = gameWithCategories[0].game;

    // Extract unique categories (filter out null categories from left join)
    const categories = gameWithCategories
      .map(row => row.category)
      .filter((category): category is NonNullable<typeof category> => category !== null)
      .filter((category, index, arr) => 
        arr.findIndex(c => c.id === category.id) === index
      );

    // Convert numeric fields back to numbers
    return {
      ...gameData,
      complexity_rating: parseFloat(gameData.complexity_rating),
      bgg_rating: gameData.bgg_rating ? parseFloat(gameData.bgg_rating) : null,
      songs: songs,
      categories: categories
    };
  } catch (error) {
    console.error('Failed to fetch game by ID:', error);
    throw error;
  }
}
