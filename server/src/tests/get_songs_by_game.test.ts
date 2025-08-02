
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, songsTable, songRatingsTable } from '../db/schema';
import { getSongsByGame } from '../handlers/get_songs_by_game';
import { type CreateGameInput, type CreateSongInput, type RateSongInput } from '../schema';

// Test data
const testGame: CreateGameInput = {
  name: 'Test Game',
  description: 'A game for testing',
  rules_text: 'Test rules',
  min_players: 2,
  max_players: 4,
  playtime_minutes: 60,
  age_rating: 12,
  complexity_rating: 3.5,
  bgg_id: null,
  amazon_link: null,
  bol_link: null,
  youtube_tutorial_url: null,
  cover_image_url: null
};

const testSong1: CreateSongInput = {
  game_id: 1, // Will be set after creating game
  title: 'Test Song 1',
  description: 'First test song',
  suno_track_id: 'suno123',
  audio_url: 'https://example.com/song1.mp3',
  duration_seconds: 180,
  genre: 'Rock'
};

const testSong2: CreateSongInput = {
  game_id: 1, // Will be set after creating game
  title: 'Test Song 2',
  description: null,
  suno_track_id: 'suno456',
  audio_url: 'https://example.com/song2.mp3',
  duration_seconds: 240,
  genre: 'Electronic'
};

describe('getSongsByGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for game with no songs', async () => {
    // Create a game without songs
    const gameResult = await db.insert(gamesTable)
      .values({
        ...testGame,
        complexity_rating: testGame.complexity_rating.toString()
      })
      .returning()
      .execute();

    const result = await getSongsByGame(gameResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return songs for a game without ratings', async () => {
    // Create game
    const gameResult = await db.insert(gamesTable)
      .values({
        ...testGame,
        complexity_rating: testGame.complexity_rating.toString()
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    // Create songs
    await db.insert(songsTable)
      .values([
        { ...testSong1, game_id: gameId },
        { ...testSong2, game_id: gameId }
      ])
      .execute();

    const result = await getSongsByGame(gameId);

    expect(result).toHaveLength(2);
    
    const song1 = result.find(s => s.title === 'Test Song 1');
    const song2 = result.find(s => s.title === 'Test Song 2');

    expect(song1).toBeDefined();
    expect(song1!.game_id).toEqual(gameId);
    expect(song1!.description).toEqual('First test song');
    expect(song1!.suno_track_id).toEqual('suno123');
    expect(song1!.audio_url).toEqual('https://example.com/song1.mp3');
    expect(song1!.duration_seconds).toEqual(180);
    expect(song1!.genre).toEqual('Rock');
    expect(song1!.average_rating).toBeNull();
    expect(song1!.total_ratings).toEqual(0);
    expect(song1!.created_at).toBeInstanceOf(Date);

    expect(song2).toBeDefined();
    expect(song2!.description).toBeNull();
    expect(song2!.genre).toEqual('Electronic');
    expect(song2!.average_rating).toBeNull();
    expect(song2!.total_ratings).toEqual(0);
  });

  it('should return songs with calculated ratings', async () => {
    // Create game
    const gameResult = await db.insert(gamesTable)
      .values({
        ...testGame,
        complexity_rating: testGame.complexity_rating.toString()
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    // Create songs
    const songResults = await db.insert(songsTable)
      .values([
        { ...testSong1, game_id: gameId },
        { ...testSong2, game_id: gameId }
      ])
      .returning()
      .execute();

    const song1Id = songResults[0].id;
    const song2Id = songResults[1].id;

    // Add ratings for first song: 4, 5, 3 (average = 4.0)
    await db.insert(songRatingsTable)
      .values([
        { song_id: song1Id, user_ip: '192.168.1.1', rating: 4 },
        { song_id: song1Id, user_ip: '192.168.1.2', rating: 5 },
        { song_id: song1Id, user_ip: '192.168.1.3', rating: 3 }
      ])
      .execute();

    // Add rating for second song: 2 (average = 2.0)
    await db.insert(songRatingsTable)
      .values([
        { song_id: song2Id, user_ip: '192.168.1.1', rating: 2 }
      ])
      .execute();

    const result = await getSongsByGame(gameId);

    expect(result).toHaveLength(2);

    const song1 = result.find(s => s.title === 'Test Song 1');
    const song2 = result.find(s => s.title === 'Test Song 2');

    expect(song1).toBeDefined();
    expect(typeof song1!.average_rating).toBe('number');
    expect(song1!.average_rating).toBeCloseTo(4.0, 1);
    expect(song1!.total_ratings).toEqual(3);

    expect(song2).toBeDefined();
    expect(typeof song2!.average_rating).toBe('number');
    expect(song2!.average_rating).toBeCloseTo(2.0, 1);
    expect(song2!.total_ratings).toEqual(1);
  });

  it('should only return songs for the specified game', async () => {
    // Create two games
    const gameResults = await db.insert(gamesTable)
      .values([
        {
          ...testGame,
          name: 'Game 1',
          complexity_rating: testGame.complexity_rating.toString()
        },
        {
          ...testGame,
          name: 'Game 2',
          complexity_rating: testGame.complexity_rating.toString()
        }
      ])
      .returning()
      .execute();

    const game1Id = gameResults[0].id;
    const game2Id = gameResults[1].id;

    // Create songs for both games
    await db.insert(songsTable)
      .values([
        { ...testSong1, game_id: game1Id, title: 'Game 1 Song' },
        { ...testSong2, game_id: game2Id, title: 'Game 2 Song' }
      ])
      .execute();

    const result = await getSongsByGame(game1Id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Game 1 Song');
    expect(result[0].game_id).toEqual(game1Id);
  });
});
