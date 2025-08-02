
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, songsTable, songRatingsTable } from '../db/schema';
import { type RateSongInput } from '../schema';
import { rateSong } from '../handlers/rate_song';
import { eq, and } from 'drizzle-orm';

const testRatingInput: RateSongInput = {
  song_id: 1,
  user_ip: '192.168.1.1',
  rating: 4
};

describe('rateSong', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new song rating', async () => {
    // Create prerequisite game
    const game = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.50'
      })
      .returning()
      .execute();

    // Create prerequisite song
    const song = await db.insert(songsTable)
      .values({
        game_id: game[0].id,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test123',
        audio_url: 'https://example.com/song.mp3',
        duration_seconds: 180,
        genre: 'Rock'
      })
      .returning()
      .execute();

    const input = { ...testRatingInput, song_id: song[0].id };
    const result = await rateSong(input);

    // Basic field validation
    expect(result.song_id).toEqual(song[0].id);
    expect(result.user_ip).toEqual('192.168.1.1');
    expect(result.rating).toEqual(4);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save rating to database', async () => {
    // Create prerequisite game and song
    const game = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.50'
      })
      .returning()
      .execute();

    const song = await db.insert(songsTable)
      .values({
        game_id: game[0].id,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test123',
        audio_url: 'https://example.com/song.mp3',
        duration_seconds: 180,
        genre: 'Rock'
      })
      .returning()
      .execute();

    const input = { ...testRatingInput, song_id: song[0].id };
    const result = await rateSong(input);

    // Query database to verify rating was saved
    const ratings = await db.select()
      .from(songRatingsTable)
      .where(eq(songRatingsTable.id, result.id))
      .execute();

    expect(ratings).toHaveLength(1);
    expect(ratings[0].song_id).toEqual(song[0].id);
    expect(ratings[0].user_ip).toEqual('192.168.1.1');
    expect(ratings[0].rating).toEqual(4);
    expect(ratings[0].created_at).toBeInstanceOf(Date);
    expect(ratings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing rating from same IP', async () => {
    // Create prerequisite game and song
    const game = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.50'
      })
      .returning()
      .execute();

    const song = await db.insert(songsTable)
      .values({
        game_id: game[0].id,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test123',
        audio_url: 'https://example.com/song.mp3',
        duration_seconds: 180,
        genre: 'Rock'
      })
      .returning()
      .execute();

    // Create initial rating
    const initialInput = { ...testRatingInput, song_id: song[0].id, rating: 3 };
    const initialResult = await rateSong(initialInput);

    // Update rating from same IP
    const updateInput = { ...testRatingInput, song_id: song[0].id, rating: 5 };
    const updateResult = await rateSong(updateInput);

    // Should have same ID (updated, not created new)
    expect(updateResult.id).toEqual(initialResult.id);
    expect(updateResult.rating).toEqual(5);
    expect(updateResult.updated_at > initialResult.updated_at).toBe(true);

    // Verify only one rating exists for this song-IP combination
    const allRatings = await db.select()
      .from(songRatingsTable)
      .where(
        and(
          eq(songRatingsTable.song_id, song[0].id),
          eq(songRatingsTable.user_ip, '192.168.1.1')
        )
      )
      .execute();

    expect(allRatings).toHaveLength(1);
    expect(allRatings[0].rating).toEqual(5);
  });

  it('should allow different IPs to rate the same song', async () => {
    // Create prerequisite game and song
    const game = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.50'
      })
      .returning()
      .execute();

    const song = await db.insert(songsTable)
      .values({
        game_id: game[0].id,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test123',
        audio_url: 'https://example.com/song.mp3',
        duration_seconds: 180,
        genre: 'Rock'
      })
      .returning()
      .execute();

    // Rate from first IP
    const firstInput = { ...testRatingInput, song_id: song[0].id, user_ip: '192.168.1.1', rating: 4 };
    await rateSong(firstInput);

    // Rate from second IP
    const secondInput = { ...testRatingInput, song_id: song[0].id, user_ip: '192.168.1.2', rating: 2 };
    await rateSong(secondInput);

    // Verify both ratings exist
    const allRatings = await db.select()
      .from(songRatingsTable)
      .where(eq(songRatingsTable.song_id, song[0].id))
      .execute();

    expect(allRatings).toHaveLength(2);
    expect(allRatings.map(r => r.user_ip).sort()).toEqual(['192.168.1.1', '192.168.1.2']);
    expect(allRatings.map(r => r.rating).sort()).toEqual([2, 4]);
  });

  it('should throw error for non-existent song', async () => {
    const input = { ...testRatingInput, song_id: 999 };

    await expect(rateSong(input)).rejects.toThrow(/song with id 999 not found/i);
  });
});
