
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { type CreateGameInput } from '../schema';
import { createGame } from '../handlers/create_game';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateGameInput = {
  name: 'Catan',
  description: 'A classic strategy board game about building settlements and trading resources.',
  rules_text: 'Players build roads, settlements, and cities while trading resources.',
  min_players: 3,
  max_players: 4,
  playtime_minutes: 90,
  age_rating: 10,
  complexity_rating: 2.5,
  bgg_id: 13,
  amazon_link: 'https://amazon.com/catan',
  bol_link: 'https://bol.com/catan',
  youtube_tutorial_url: 'https://youtube.com/watch?v=catan',
  cover_image_url: 'https://example.com/catan.jpg'
};

describe('createGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a game', async () => {
    const result = await createGame(testInput);

    // Basic field validation
    expect(result.name).toEqual('Catan');
    expect(result.description).toEqual(testInput.description);
    expect(result.rules_text).toEqual(testInput.rules_text);
    expect(result.min_players).toEqual(3);
    expect(result.max_players).toEqual(4);
    expect(result.playtime_minutes).toEqual(90);
    expect(result.age_rating).toEqual(10);
    expect(result.complexity_rating).toEqual(2.5);
    expect(typeof result.complexity_rating).toBe('number');
    expect(result.bgg_id).toEqual(13);
    expect(result.amazon_link).toEqual(testInput.amazon_link);
    expect(result.bol_link).toEqual(testInput.bol_link);
    expect(result.youtube_tutorial_url).toEqual(testInput.youtube_tutorial_url);
    expect(result.cover_image_url).toEqual(testInput.cover_image_url);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.bgg_rating).toBeNull();
    expect(result.bgg_rank).toBeNull();
  });

  it('should save game to database', async () => {
    const result = await createGame(testInput);

    // Query using proper drizzle syntax
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, result.id))
      .execute();

    expect(games).toHaveLength(1);
    expect(games[0].name).toEqual('Catan');
    expect(games[0].description).toEqual(testInput.description);
    expect(parseFloat(games[0].complexity_rating)).toEqual(2.5);
    expect(games[0].bgg_id).toEqual(13);
    expect(games[0].created_at).toBeInstanceOf(Date);
  });

  it('should create game with category associations', async () => {
    // Create test categories first
    const categoryResults = await db.insert(gameCategoriesTable)
      .values([
        { name: 'Strategy', description: 'Strategic thinking games' },
        { name: 'Trading', description: 'Games involving resource trading' }
      ])
      .returning()
      .execute();

    const categoryIds = categoryResults.map(cat => cat.id);

    // Create game with category associations
    const gameInput: CreateGameInput = {
      ...testInput,
      category_ids: categoryIds
    };

    const result = await createGame(gameInput);

    // Verify category relations were created
    const relations = await db.select()
      .from(gameCategoryRelationsTable)
      .where(eq(gameCategoryRelationsTable.game_id, result.id))
      .execute();

    expect(relations).toHaveLength(2);
    expect(relations.map(r => r.category_id)).toEqual(expect.arrayContaining(categoryIds));
  });

  it('should create game without categories', async () => {
    const gameInput: CreateGameInput = {
      ...testInput,
      category_ids: undefined
    };

    const result = await createGame(gameInput);

    // Verify no category relations were created
    const relations = await db.select()
      .from(gameCategoryRelationsTable)
      .where(eq(gameCategoryRelationsTable.game_id, result.id))
      .execute();

    expect(relations).toHaveLength(0);
  });

  it('should handle nullable fields correctly', async () => {
    const minimalInput: CreateGameInput = {
      name: 'Minimal Game',
      description: 'A minimal game for testing',
      rules_text: 'Simple rules',
      min_players: 2,
      max_players: 4,
      playtime_minutes: 30,
      age_rating: 8,
      complexity_rating: 1.5,
      bgg_id: null,
      amazon_link: null,
      bol_link: null,
      youtube_tutorial_url: null,
      cover_image_url: null
    };

    const result = await createGame(minimalInput);

    expect(result.bgg_id).toBeNull();
    expect(result.amazon_link).toBeNull();
    expect(result.bol_link).toBeNull();
    expect(result.youtube_tutorial_url).toBeNull();
    expect(result.cover_image_url).toBeNull();
    expect(result.bgg_rating).toBeNull();
    expect(result.bgg_rank).toBeNull();
  });
});
