
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, gameCategoriesTable } from '../db/schema';
import { type CreateGameInput } from '../schema';
import { updateBggStats } from '../handlers/update_bgg_stats';
import { eq } from 'drizzle-orm';

// Test game input with BGG ID
const testGameInput: CreateGameInput = {
  name: 'Test Game',
  description: 'A board game for testing BGG stats',
  rules_text: 'Test rules',
  min_players: 2,
  max_players: 4,
  playtime_minutes: 60,
  age_rating: 10,
  complexity_rating: 3.0,
  bgg_id: 12345,
  amazon_link: null,
  bol_link: null,
  youtube_tutorial_url: null,
  cover_image_url: null
};

// Test game input without BGG ID
const testGameInputNoBgg: CreateGameInput = {
  name: 'Test Game No BGG',
  description: 'A board game without BGG ID',
  rules_text: 'Test rules',
  min_players: 2,
  max_players: 4,
  playtime_minutes: 60,
  age_rating: 10,
  complexity_rating: 3.0,
  bgg_id: null,
  amazon_link: null,
  bol_link: null,
  youtube_tutorial_url: null,
  cover_image_url: null
};

describe('updateBggStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update BGG stats for a game with BGG ID', async () => {
    // Create test game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: testGameInput.name,
        description: testGameInput.description,
        rules_text: testGameInput.rules_text,
        min_players: testGameInput.min_players,
        max_players: testGameInput.max_players,
        playtime_minutes: testGameInput.playtime_minutes,
        age_rating: testGameInput.age_rating,
        complexity_rating: testGameInput.complexity_rating.toString(),
        bgg_id: testGameInput.bgg_id,
        bgg_rating: null,
        bgg_rank: null
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    // Update BGG stats
    const result = await updateBggStats(gameId);

    // Verify the result
    expect(result.id).toEqual(gameId);
    expect(result.name).toEqual('Test Game');
    expect(typeof result.bgg_rating).toBe('number');
    expect(typeof result.bgg_rank).toBe('number');
    expect(result.bgg_rating).toBeGreaterThan(7.5);
    expect(result.bgg_rating).toBeLessThan(8.5);
    expect(result.bgg_rank).toBeGreaterThanOrEqual(100);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated BGG stats to database', async () => {
    // Create test game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: testGameInput.name,
        description: testGameInput.description,
        rules_text: testGameInput.rules_text,
        min_players: testGameInput.min_players,
        max_players: testGameInput.max_players,
        playtime_minutes: testGameInput.playtime_minutes,
        age_rating: testGameInput.age_rating,
        complexity_rating: testGameInput.complexity_rating.toString(),
        bgg_id: testGameInput.bgg_id,
        bgg_rating: null,
        bgg_rank: null
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    // Update BGG stats
    await updateBggStats(gameId);

    // Verify database was updated
    const updatedGames = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, gameId))
      .execute();

    expect(updatedGames).toHaveLength(1);
    const updatedGame = updatedGames[0];
    expect(updatedGame.bgg_rating).not.toBeNull();
    expect(updatedGame.bgg_rank).not.toBeNull();
    expect(parseFloat(updatedGame.bgg_rating!)).toBeGreaterThan(7.5);
    expect(updatedGame.bgg_rank).toBeGreaterThanOrEqual(100);
  });

  it('should throw error for non-existent game', async () => {
    await expect(updateBggStats(99999)).rejects.toThrow(/not found/i);
  });

  it('should throw error for game without BGG ID', async () => {
    // Create test game without BGG ID
    const gameResult = await db.insert(gamesTable)
      .values({
        name: testGameInputNoBgg.name,
        description: testGameInputNoBgg.description,
        rules_text: testGameInputNoBgg.rules_text,
        min_players: testGameInputNoBgg.min_players,
        max_players: testGameInputNoBgg.max_players,
        playtime_minutes: testGameInputNoBgg.playtime_minutes,
        age_rating: testGameInputNoBgg.age_rating,
        complexity_rating: testGameInputNoBgg.complexity_rating.toString(),
        bgg_id: null,
        bgg_rating: null,
        bgg_rank: null
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;

    await expect(updateBggStats(gameId)).rejects.toThrow(/no BGG ID/i);
  });

  it('should preserve existing game data while updating BGG stats', async () => {
    // Create test game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: testGameInput.name,
        description: testGameInput.description,
        rules_text: testGameInput.rules_text,
        min_players: testGameInput.min_players,
        max_players: testGameInput.max_players,
        playtime_minutes: testGameInput.playtime_minutes,
        age_rating: testGameInput.age_rating,
        complexity_rating: testGameInput.complexity_rating.toString(),
        bgg_id: testGameInput.bgg_id,
        bgg_rating: null,
        bgg_rank: null
      })
      .returning()
      .execute();

    const gameId = gameResult[0].id;
    const originalCreatedAt = gameResult[0].created_at;

    // Update BGG stats
    const result = await updateBggStats(gameId);

    // Verify other fields are preserved
    expect(result.name).toEqual(testGameInput.name);
    expect(result.description).toEqual(testGameInput.description);
    expect(result.min_players).toEqual(testGameInput.min_players);
    expect(result.max_players).toEqual(testGameInput.max_players);
    expect(result.bgg_id).toEqual(testGameInput.bgg_id);
    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });
});
