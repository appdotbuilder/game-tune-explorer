
import { db } from '../db';
import { songRatingsTable } from '../db/schema';
import { eq, avg, count } from 'drizzle-orm';

export async function getSongRatings(songId: number): Promise<{ average_rating: number; total_ratings: number }> {
  try {
    // Query aggregate statistics for the song
    const result = await db
      .select({
        average_rating: avg(songRatingsTable.rating),
        total_ratings: count(songRatingsTable.id)
      })
      .from(songRatingsTable)
      .where(eq(songRatingsTable.song_id, songId))
      .execute();

    const stats = result[0];
    
    return {
      average_rating: stats.average_rating ? parseFloat(stats.average_rating.toString()) : 0,
      total_ratings: stats.total_ratings
    };
  } catch (error) {
    console.error('Failed to get song ratings:', error);
    throw error;
  }
}
