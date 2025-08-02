
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { songsTable, gamesTable } from '../db/schema';
import { type CreateSongInput } from '../schema';
import { createSong } from '../handlers/create_song';
import { eq } from 'drizzle-orm';

// Test game data
const testGame = {
  name: 'Test Game',
  description: 'A game for testing',
  rules_text: 'Test rules',
  min_players: 2,
  max_players: 4,
  playtime_minutes: 60,
  age_rating: 12,
  complexity_rating: '3.5', // String for numeric column
  bgg_id: 12345,
  amazon_link: 'https://amazon.com/test',
  bol_link: 'https://bol.com/test',
  youtube_tutorial_url: 'https://youtube.com/test',
  cover_image_url: 'https://example.com/cover.jpg'
};

// Test song input
const testInput: CreateSongInput = {
  game_id: 1, // Will be set after creating test game
  title: 'Epic Board Game Theme',
  description: 'An AI-generated theme song for the game',
  suno_track_id: 'suno_12345',
  audio_url: 'https://example.com/song.mp3',
  duration_seconds: 180,
  genre: 'Epic Orchestral'
};

describe('createSong', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a song', async () => {
    // Create test game first
    const gameResult = await db.insert(gamesTable)
      .values(testGame)
      .returning()
      .execute();
    const gameId = gameResult[0].id;

    // Update test input with actual game ID
    const songInput = { ...testInput, game_id: gameId };
    const result = await createSong(songInput);

    // Basic field validation
    expect(result.game_id).toEqual(gameId);
    expect(result.title).toEqual('Epic Board Game Theme');
    expect(result.description).toEqual(testInput.description);
    expect(result.suno_track_id).toEqual('suno_12345');
    expect(result.audio_url).toEqual(testInput.audio_url);
    expect(result.duration_seconds).toEqual(180);
    expect(result.genre).toEqual('Epic Orchestral');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save song to database', async () => {
    // Create test game first
    const gameResult = await db.insert(gamesTable)
      .values(testGame)
      .returning()
      .execute();
    const gameId = gameResult[0].id;

    // Create song
    const songInput = { ...testInput, game_id: gameId };
    const result = await createSong(songInput);

    // Query using proper drizzle syntax
    const songs = await db.select()
      .from(songsTable)
      .where(eq(songsTable.id, result.id))
      .execute();

    expect(songs).toHaveLength(1);
    expect(songs[0].game_id).toEqual(gameId);
    expect(songs[0].title).toEqual('Epic Board Game Theme');
    expect(songs[0].description).toEqual(testInput.description);
    expect(songs[0].suno_track_id).toEqual('suno_12345');
    expect(songs[0].audio_url).toEqual(testInput.audio_url);
    expect(songs[0].duration_seconds).toEqual(180);
    expect(songs[0].genre).toEqual('Epic Orchestral');
    expect(songs[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description and genre', async () => {
    // Create test game first
    const gameResult = await db.insert(gamesTable)
      .values(testGame)
      .returning()
      .execute();
    const gameId = gameResult[0].id;

    // Create song with null optional fields
    const songInput = {
      ...testInput,
      game_id: gameId,
      description: null,
      genre: null
    };
    const result = await createSong(songInput);

    expect(result.description).toBeNull();
    expect(result.genre).toBeNull();
    expect(result.title).toEqual('Epic Board Game Theme');
    expect(result.suno_track_id).toEqual('suno_12345');
  });

  it('should throw error when game does not exist', async () => {
    const songInput = { ...testInput, game_id: 999 };
    
    await expect(createSong(songInput)).rejects.toThrow(/game with id 999 does not exist/i);
  });

  it('should create multiple songs for the same game', async () => {
    // Create test game first
    const gameResult = await db.insert(gamesTable)
      .values(testGame)
      .returning()
      .execute();
    const gameId = gameResult[0].id;

    // Create first song
    const firstSongInput = { ...testInput, game_id: gameId, title: 'First Song' };
    const firstResult = await createSong(firstSongInput);

    // Create second song
    const secondSongInput = { ...testInput, game_id: gameId, title: 'Second Song' };
    const secondResult = await createSong(secondSongInput);

    // Verify both songs exist
    const songs = await db.select()
      .from(songsTable)
      .where(eq(songsTable.game_id, gameId))
      .execute();

    expect(songs).toHaveLength(2);
    expect(songs.map(s => s.title)).toContain('First Song');
    expect(songs.map(s => s.title)).toContain('Second Song');
    expect(firstResult.id).not.toEqual(secondResult.id);
  });
});
