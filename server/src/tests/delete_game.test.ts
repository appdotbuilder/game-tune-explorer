
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, songsTable, songRatingsTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { deleteGame } from '../handlers/delete_game';
import { eq } from 'drizzle-orm';

describe('deleteGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing game', async () => {
    // Create test game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 10,
        complexity_rating: '3.5'
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    const result = await deleteGame(gameId);

    expect(result).toBe(true);

    // Verify game is deleted
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, gameId))
      .execute();

    expect(games).toHaveLength(0);
  });

  it('should return false when deleting non-existent game', async () => {
    const result = await deleteGame(99999);

    expect(result).toBe(false);
  });

  it('should cascade delete associated songs and ratings', async () => {
    // Create test game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 10,
        complexity_rating: '3.5'
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    // Create test song
    const songResult = await db.insert(songsTable)
      .values({
        game_id: gameId,
        title: 'Test Song',
        description: 'A test song',
        suno_track_id: 'test123',
        audio_url: 'https://example.com/song.mp3',
        duration_seconds: 180,
        genre: 'Folk'
      })
      .returning()
      .execute();

    const songId = songResult[0].id;

    // Create test rating
    await db.insert(songRatingsTable)
      .values({
        song_id: songId,
        user_ip: '192.168.1.1',
        rating: 5
      })
      .execute();

    // Delete the game
    const result = await deleteGame(gameId);

    expect(result).toBe(true);

    // Verify song is deleted (cascade)
    const songs = await db.select()
      .from(songsTable)
      .where(eq(songsTable.game_id, gameId))
      .execute();

    expect(songs).toHaveLength(0);

    // Verify rating is deleted (cascade through song)
    const ratings = await db.select()
      .from(songRatingsTable)
      .where(eq(songRatingsTable.song_id, songId))
      .execute();

    expect(ratings).toHaveLength(0);
  });

  it('should cascade delete category relationships', async () => {
    // Create test category
    const categoryResult = await db.insert(gameCategoriesTable)
      .values({
        name: 'Strategy',
        description: 'Strategic games'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 10,
        complexity_rating: '3.5'
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    // Create category relationship
    await db.insert(gameCategoryRelationsTable)
      .values({
        game_id: gameId,
        category_id: categoryId
      })
      .execute();

    // Delete the game
    const result = await deleteGame(gameId);

    expect(result).toBe(true);

    // Verify category relationship is deleted (cascade)
    const relations = await db.select()
      .from(gameCategoryRelationsTable)
      .where(eq(gameCategoryRelationsTable.game_id, gameId))
      .execute();

    expect(relations).toHaveLength(0);

    // Verify category itself still exists
    const categories = await db.select()
      .from(gameCategoriesTable)
      .where(eq(gameCategoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should handle deletion of game with multiple related records', async () => {
    // Create test category
    const categoryResult = await db.insert(gameCategoriesTable)
      .values({
        name: 'Strategy',
        description: 'Strategic games'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Complex Game',
        description: 'A complex test game',
        rules_text: 'Complex rules',
        min_players: 1,
        max_players: 6,
        playtime_minutes: 120,
        age_rating: 12,
        complexity_rating: '4.2'
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    // Create multiple songs
    const song1Result = await db.insert(songsTable)
      .values({
        game_id: gameId,
        title: 'Theme Song',
        suno_track_id: 'theme123',
        audio_url: 'https://example.com/theme.mp3',
        duration_seconds: 240
      })
      .returning()
      .execute();

    const song2Result = await db.insert(songsTable)
      .values({
        game_id: gameId,
        title: 'Victory Song',
        suno_track_id: 'victory456',
        audio_url: 'https://example.com/victory.mp3',
        duration_seconds: 180
      })
      .returning()
      .execute();

    // Create multiple ratings
    await db.insert(songRatingsTable)
      .values([
        {
          song_id: song1Result[0].id,
          user_ip: '192.168.1.1',
          rating: 4
        },
        {
          song_id: song1Result[0].id,
          user_ip: '192.168.1.2',
          rating: 5
        },
        {
          song_id: song2Result[0].id,
          user_ip: '192.168.1.1',
          rating: 3
        }
      ])
      .execute();

    // Create category relationship
    await db.insert(gameCategoryRelationsTable)
      .values({
        game_id: gameId,
        category_id: categoryId
      })
      .execute();

    // Delete the game
    const result = await deleteGame(gameId);

    expect(result).toBe(true);

    // Verify all related data is deleted
    const songs = await db.select()
      .from(songsTable)
      .where(eq(songsTable.game_id, gameId))
      .execute();

    expect(songs).toHaveLength(0);

    const ratings = await db.select()
      .from(songRatingsTable)
      .execute();

    expect(ratings).toHaveLength(0);

    const relations = await db.select()
      .from(gameCategoryRelationsTable)
      .where(eq(gameCategoryRelationsTable.game_id, gameId))
      .execute();

    expect(relations).toHaveLength(0);
  });
});
