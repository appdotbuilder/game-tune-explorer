
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, songsTable, songRatingsTable } from '../db/schema';
import { getSongRatings } from '../handlers/get_song_ratings';

describe('getSongRatings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values when no ratings exist', async () => {
    // Create a game first
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.5'
      })
      .returning()
      .execute();

    // Create a song
    const songResult = await db.insert(songsTable)
      .values({
        game_id: gameResult[0].id,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test-track-123',
        audio_url: 'https://example.com/audio.mp3',
        duration_seconds: 180,
        genre: 'Epic'
      })
      .returning()
      .execute();

    const result = await getSongRatings(songResult[0].id);

    expect(result.average_rating).toEqual(0);
    expect(result.total_ratings).toEqual(0);
  });

  it('should calculate correct average and count with single rating', async () => {
    // Create prerequisites
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.5'
      })
      .returning()
      .execute();

    const songResult = await db.insert(songsTable)
      .values({
        game_id: gameResult[0].id,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test-track-123',
        audio_url: 'https://example.com/audio.mp3',
        duration_seconds: 180,
        genre: 'Epic'
      })
      .returning()
      .execute();

    // Add a single rating
    await db.insert(songRatingsTable)
      .values({
        song_id: songResult[0].id,
        user_ip: '192.168.1.1',
        rating: 4
      })
      .execute();

    const result = await getSongRatings(songResult[0].id);

    expect(result.average_rating).toEqual(4.0);
    expect(result.total_ratings).toEqual(1);
  });

  it('should calculate correct average with multiple ratings', async () => {
    // Create prerequisites
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.5'
      })
      .returning()
      .execute();

    const songResult = await db.insert(songsTable)
      .values({
        game_id: gameResult[0].id,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test-track-123',
        audio_url: 'https://example.com/audio.mp3',
        duration_seconds: 180,
        genre: 'Epic'
      })
      .returning()
      .execute();

    // Add multiple ratings: 3, 4, 5 (average = 4.0)
    await db.insert(songRatingsTable)
      .values([
        {
          song_id: songResult[0].id,
          user_ip: '192.168.1.1',
          rating: 3
        },
        {
          song_id: songResult[0].id,
          user_ip: '192.168.1.2',
          rating: 4
        },
        {
          song_id: songResult[0].id,
          user_ip: '192.168.1.3',
          rating: 5
        }
      ])
      .execute();

    const result = await getSongRatings(songResult[0].id);

    expect(result.average_rating).toEqual(4.0);
    expect(result.total_ratings).toEqual(3);
  });

  it('should only count ratings for the specified song', async () => {
    // Create prerequisites
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.5'
      })
      .returning()
      .execute();

    const songResults = await db.insert(songsTable)
      .values([
        {
          game_id: gameResult[0].id,
          title: 'Song One',
          description: 'First test song',
          suno_track_id: 'test-track-1',
          audio_url: 'https://example.com/audio1.mp3',
          duration_seconds: 180,
          genre: 'Epic'
        },
        {
          game_id: gameResult[0].id,
          title: 'Song Two',
          description: 'Second test song',
          suno_track_id: 'test-track-2',
          audio_url: 'https://example.com/audio2.mp3',
          duration_seconds: 200,
          genre: 'Adventure'
        }
      ])
      .returning()
      .execute();

    // Add ratings to both songs
    await db.insert(songRatingsTable)
      .values([
        // Ratings for song 1 (average = 3.0)
        { song_id: songResults[0].id, user_ip: '192.168.1.1', rating: 3 },
        { song_id: songResults[0].id, user_ip: '192.168.1.2', rating: 3 },
        // Ratings for song 2 (should not affect song 1 results)
        { song_id: songResults[1].id, user_ip: '192.168.1.3', rating: 5 },
        { song_id: songResults[1].id, user_ip: '192.168.1.4', rating: 5 }
      ])
      .execute();

    const result = await getSongRatings(songResults[0].id);

    expect(result.average_rating).toEqual(3.0);
    expect(result.total_ratings).toEqual(2);
  });

  it('should handle non-existent song ID gracefully', async () => {
    const result = await getSongRatings(999999);

    expect(result.average_rating).toEqual(0);
    expect(result.total_ratings).toEqual(0);
  });
});
