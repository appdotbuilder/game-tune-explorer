
import { db } from '../db';
import { songsTable, songRatingsTable } from '../db/schema';
import { type SongWithRating } from '../schema';
import { eq, avg, count } from 'drizzle-orm';

export async function getSongsByGame(gameId: number): Promise<SongWithRating[]> {
  try {
    // Query songs with their ratings aggregated
    const results = await db
      .select({
        id: songsTable.id,
        game_id: songsTable.game_id,
        title: songsTable.title,
        description: songsTable.description,
        suno_track_id: songsTable.suno_track_id,
        audio_url: songsTable.audio_url,
        duration_seconds: songsTable.duration_seconds,
        genre: songsTable.genre,
        created_at: songsTable.created_at,
        average_rating: avg(songRatingsTable.rating),
        total_ratings: count(songRatingsTable.id)
      })
      .from(songsTable)
      .leftJoin(songRatingsTable, eq(songsTable.id, songRatingsTable.song_id))
      .where(eq(songsTable.game_id, gameId))
      .groupBy(
        songsTable.id,
        songsTable.game_id,
        songsTable.title,
        songsTable.description,
        songsTable.suno_track_id,
        songsTable.audio_url,
        songsTable.duration_seconds,
        songsTable.genre,
        songsTable.created_at
      )
      .execute();

    // Convert numeric fields and handle null ratings
    return results.map(result => ({
      id: result.id,
      game_id: result.game_id,
      title: result.title,
      description: result.description,
      suno_track_id: result.suno_track_id,
      audio_url: result.audio_url,
      duration_seconds: result.duration_seconds,
      genre: result.genre,
      created_at: result.created_at,
      average_rating: result.average_rating ? parseFloat(result.average_rating) : null,
      total_ratings: result.total_ratings
    }));
  } catch (error) {
    console.error('Failed to get songs by game:', error);
    throw error;
  }
}
