
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { type UpdateGameInput } from '../schema';
import { updateGame } from '../handlers/update_game';
import { eq } from 'drizzle-orm';

// Helper function to create a test game
const createTestGame = async (): Promise<number> => {
  const gameData = {
    name: 'Original Game',
    description: 'Original description',
    rules_text: 'Original rules',
    min_players: 2,
    max_players: 4,
    playtime_minutes: 60,
    age_rating: 12,
    complexity_rating: '3.0',
    bgg_id: 123,
    bgg_rating: '7.5',
    bgg_rank: 100,
    amazon_link: 'https://amazon.com/original',
    bol_link: 'https://bol.com/original',
    youtube_tutorial_url: 'https://youtube.com/original',
    cover_image_url: 'https://example.com/original.jpg'
  };

  const result = await db.insert(gamesTable)
    .values(gameData)
    .returning()
    .execute();

  return result[0].id;
};

// Helper function to create a test category
const createTestCategory = async (name: string): Promise<number> => {
  const result = await db.insert(gameCategoriesTable)
    .values({ name, description: `${name} category` })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic game fields', async () => {
    const gameId = await createTestGame();

    const updateInput: UpdateGameInput = {
      id: gameId,
      name: 'Updated Game Name',
      description: 'Updated description',
      complexity_rating: 4.5
    };

    const result = await updateGame(updateInput);

    expect(result.id).toEqual(gameId);
    expect(result.name).toEqual('Updated Game Name');
    expect(result.description).toEqual('Updated description');
    expect(result.complexity_rating).toEqual(4.5);
    expect(typeof result.complexity_rating).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify fields not in update remain unchanged
    expect(result.rules_text).toEqual('Original rules');
    expect(result.min_players).toEqual(2);
  });

  it('should update numeric fields correctly', async () => {
    const gameId = await createTestGame();

    const updateInput: UpdateGameInput = {
      id: gameId,
      complexity_rating: 2.8,
      playtime_minutes: 90,
      age_rating: 14
    };

    const result = await updateGame(updateInput);

    expect(result.complexity_rating).toEqual(2.8);
    expect(typeof result.complexity_rating).toBe('number');
    expect(result.playtime_minutes).toEqual(90);
    expect(result.age_rating).toEqual(14);
  });

  it('should handle null values correctly', async () => {
    const gameId = await createTestGame();

    const updateInput: UpdateGameInput = {
      id: gameId,
      bgg_id: null,
      amazon_link: null,
      bol_link: null
    };

    const result = await updateGame(updateInput);

    expect(result.bgg_id).toBeNull();
    expect(result.amazon_link).toBeNull();
    expect(result.bol_link).toBeNull();
  });

  it('should update category relationships', async () => {
    const gameId = await createTestGame();
    const category1Id = await createTestCategory('Strategy');
    const category2Id = await createTestCategory('Family');

    // First, add initial categories
    await db.insert(gameCategoryRelationsTable)
      .values([
        { game_id: gameId, category_id: category1Id }
      ])
      .execute();

    const updateInput: UpdateGameInput = {
      id: gameId,
      category_ids: [category2Id]
    };

    await updateGame(updateInput);

    // Verify old category was removed and new one added
    const relations = await db.select()
      .from(gameCategoryRelationsTable)
      .where(eq(gameCategoryRelationsTable.game_id, gameId))
      .execute();

    expect(relations).toHaveLength(1);
    expect(relations[0].category_id).toEqual(category2Id);
  });

  it('should clear all categories when empty array provided', async () => {
    const gameId = await createTestGame();
    const categoryId = await createTestCategory('Strategy');

    // Add initial category
    await db.insert(gameCategoryRelationsTable)
      .values([{ game_id: gameId, category_id: categoryId }])
      .execute();

    const updateInput: UpdateGameInput = {
      id: gameId,
      category_ids: []
    };

    await updateGame(updateInput);

    // Verify all categories were removed
    const relations = await db.select()
      .from(gameCategoryRelationsTable)
      .where(eq(gameCategoryRelationsTable.game_id, gameId))
      .execute();

    expect(relations).toHaveLength(0);
  });

  it('should save changes to database', async () => {
    const gameId = await createTestGame();

    const updateInput: UpdateGameInput = {
      id: gameId,
      name: 'Database Test Game',
      playtime_minutes: 90
    };

    await updateGame(updateInput);

    // Verify changes persisted to database
    const dbGame = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, gameId))
      .execute();

    expect(dbGame).toHaveLength(1);
    expect(dbGame[0].name).toEqual('Database Test Game');
    expect(dbGame[0].playtime_minutes).toEqual(90);
    expect(dbGame[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent game', async () => {
    const updateInput: UpdateGameInput = {
      id: 99999,
      name: 'Non-existent Game'
    };

    await expect(updateGame(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const gameId = await createTestGame();

    const updateInput: UpdateGameInput = {
      id: gameId,
      max_players: 6
    };

    const result = await updateGame(updateInput);

    // Only max_players should be updated
    expect(result.max_players).toEqual(6);
    expect(result.name).toEqual('Original Game'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
  });

  it('should update URL fields correctly', async () => {
    const gameId = await createTestGame();

    const updateInput: UpdateGameInput = {
      id: gameId,
      amazon_link: 'https://amazon.com/updated',
      youtube_tutorial_url: 'https://youtube.com/updated'
    };

    const result = await updateGame(updateInput);

    expect(result.amazon_link).toEqual('https://amazon.com/updated');
    expect(result.youtube_tutorial_url).toEqual('https://youtube.com/updated');
    expect(result.bol_link).toEqual('https://bol.com/original'); // Should remain unchanged
  });

  it('should handle multiple category updates', async () => {
    const gameId = await createTestGame();
    const category1Id = await createTestCategory('Strategy');
    const category2Id = await createTestCategory('Family');
    const category3Id = await createTestCategory('Party');

    const updateInput: UpdateGameInput = {
      id: gameId,
      category_ids: [category1Id, category2Id, category3Id]
    };

    await updateGame(updateInput);

    // Verify all categories were added
    const relations = await db.select()
      .from(gameCategoryRelationsTable)
      .where(eq(gameCategoryRelationsTable.game_id, gameId))
      .execute();

    expect(relations).toHaveLength(3);
    const categoryIds = relations.map(r => r.category_id).sort();
    expect(categoryIds).toEqual([category1Id, category2Id, category3Id].sort());
  });
});
