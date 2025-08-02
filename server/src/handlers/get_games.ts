
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type Game } from '../schema';

export async function getGames(): Promise<Game[]> {
  try {
    const results = await db.select()
      .from(gamesTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(game => ({
      ...game,
      complexity_rating: parseFloat(game.complexity_rating),
      bgg_rating: game.bgg_rating ? parseFloat(game.bgg_rating) : null
    }));
  } catch (error) {
    console.error('Failed to fetch games:', error);
    throw error;
  }
}
