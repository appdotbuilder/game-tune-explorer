
import { db } from '../db';
import { songRatingsTable, songsTable } from '../db/schema';
import { type RateSongInput, type SongRating } from '../schema';
import { eq, and } from 'drizzle-orm';

export const rateSong = async (input: RateSongInput): Promise<SongRating> => {
  try {
    // First verify the song exists
    const song = await db.select()
      .from(songsTable)
      .where(eq(songsTable.id, input.song_id))
      .execute();

    if (song.length === 0) {
      throw new Error(`Song with id ${input.song_id} not found`);
    }

    // Check if user has already rated this song
    const existingRating = await db.select()
      .from(songRatingsTable)
      .where(
        and(
          eq(songRatingsTable.song_id, input.song_id),
          eq(songRatingsTable.user_ip, input.user_ip)
        )
      )
      .execute();

    if (existingRating.length > 0) {
      // Update existing rating
      const result = await db.update(songRatingsTable)
        .set({
          rating: input.rating,
          updated_at: new Date()
        })
        .where(eq(songRatingsTable.id, existingRating[0].id))
        .returning()
        .execute();

      return result[0];
    } else {
      // Create new rating
      const result = await db.insert(songRatingsTable)
        .values({
          song_id: input.song_id,
          user_ip: input.user_ip,
          rating: input.rating
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Song rating failed:', error);
    throw error;
  }
};
