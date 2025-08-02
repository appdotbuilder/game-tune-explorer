
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Game } from '../schema';

export const updateBggStats = async (gameId: number): Promise<Game> => {
  try {
    // First, verify the game exists and has a BGG ID
    const existingGame = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, gameId))
      .execute();

    if (existingGame.length === 0) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    const game = existingGame[0];
    if (!game.bgg_id) {
      throw new Error(`Game with ID ${gameId} has no BGG ID set`);
    }

    // Fetch BGG stats (mock implementation - real version would call BGG API)
    const bggStats = await fetchBggStats(game.bgg_id);

    // Update the game with new BGG stats
    const result = await db.update(gamesTable)
      .set({
        bgg_rating: bggStats.rating?.toString() || null,
        bgg_rank: bggStats.rank || null,
        updated_at: new Date()
      })
      .where(eq(gamesTable.id, gameId))
      .returning()
      .execute();

    const updatedGame = result[0];
    
    // Convert numeric fields back to numbers
    return {
      ...updatedGame,
      complexity_rating: parseFloat(updatedGame.complexity_rating),
      bgg_rating: updatedGame.bgg_rating ? parseFloat(updatedGame.bgg_rating) : null
    };
  } catch (error) {
    console.error('BGG stats update failed:', error);
    throw error;
  }
};

// Mock BGG API fetch function - in real implementation this would call the actual BGG API
async function fetchBggStats(bggId: number): Promise<{ rating?: number; rank?: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock data based on BGG ID for consistent testing
  const mockRating = 7.5 + (bggId % 100) / 100; // Rating between 7.5-8.49
  const mockRank = 100 + (bggId % 1000); // Rank between 100-1099
  
  return {
    rating: Math.round(mockRating * 100) / 100, // Round to 2 decimal places
    rank: mockRank
  };
}
