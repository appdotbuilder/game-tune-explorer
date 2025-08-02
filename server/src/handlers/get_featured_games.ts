
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type Game } from '../schema';
import { desc, isNotNull, gte, and } from 'drizzle-orm';

export async function getFeaturedGames(): Promise<Game[]> {
  try {
    // Get featured games based on BGG rating and rank criteria
    // Prioritize games with high ratings and good ranks for discovery
    const results = await db.select()
      .from(gamesTable)
      .where(
        and(
          isNotNull(gamesTable.bgg_rating),
          gte(gamesTable.bgg_rating, '7.0'), // Minimum 7.0 BGG rating
          isNotNull(gamesTable.bgg_rank)
        )
      )
      .orderBy(
        desc(gamesTable.bgg_rating), // Order by highest rating first
        desc(gamesTable.created_at)  // Then by newest additions
      )
      .limit(10) // Return top 10 featured games
      .execute();

    // Convert numeric fields from string to number
    return results.map(game => ({
      ...game,
      complexity_rating: parseFloat(game.complexity_rating),
      bgg_rating: game.bgg_rating ? parseFloat(game.bgg_rating) : null
    }));
  } catch (error) {
    console.error('Failed to get featured games:', error);
    throw error;
  }
}
