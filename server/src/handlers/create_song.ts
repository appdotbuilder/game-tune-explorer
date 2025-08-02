
import { db } from '../db';
import { songsTable, gamesTable } from '../db/schema';
import { type CreateSongInput, type Song } from '../schema';
import { eq } from 'drizzle-orm';

export const createSong = async (input: CreateSongInput): Promise<Song> => {
  try {
    // Verify the game exists first to prevent foreign key constraint violation
    const existingGame = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, input.game_id))
      .execute();

    if (existingGame.length === 0) {
      throw new Error(`Game with ID ${input.game_id} does not exist`);
    }

    // Insert song record
    const result = await db.insert(songsTable)
      .values({
        game_id: input.game_id,
        title: input.title,
        description: input.description,
        suno_track_id: input.suno_track_id,
        audio_url: input.audio_url,
        duration_seconds: input.duration_seconds,
        genre: input.genre
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Song creation failed:', error);
    throw error;
  }
};
