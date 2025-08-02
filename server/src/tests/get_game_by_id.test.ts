
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, songsTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { getGameById } from '../handlers/get_game_by_id';

describe('getGameById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent game', async () => {
    const result = await getGameById(999);
    expect(result).toBeNull();
  });

  it('should return game without songs or categories', async () => {
    // Create a basic game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Test Game',
        description: 'A test game',
        rules_text: 'Test rules',
        min_players: 2,
        max_players: 4,
        playtime_minutes: 60,
        age_rating: 12,
        complexity_rating: '3.5',
        bgg_id: 123456,
        bgg_rating: '7.8',
        bgg_rank: 100
      })
      .returning()
      .execute();

    const game = gameResult[0];
    const result = await getGameById(game.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(game.id);
    expect(result!.name).toEqual('Test Game');
    expect(result!.description).toEqual('A test game');
    expect(result!.complexity_rating).toEqual(3.5);
    expect(result!.bgg_rating).toEqual(7.8);
    expect(result!.bgg_id).toEqual(123456);
    expect(result!.bgg_rank).toEqual(100);
    expect(result!.songs).toEqual([]);
    expect(result!.categories).toEqual([]);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return game with songs', async () => {
    // Create game
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

    const game = gameResult[0];

    // Create songs for the game
    await db.insert(songsTable)
      .values([
        {
          game_id: game.id,
          title: 'Epic Game Song',
          description: 'An epic song for the game',
          suno_track_id: 'suno_123',
          audio_url: 'https://example.com/song1.mp3',
          duration_seconds: 180,
          genre: 'Epic'
        },
        {
          game_id: game.id,
          title: 'Chill Game Theme',
          suno_track_id: 'suno_456',
          audio_url: 'https://example.com/song2.mp3',
          duration_seconds: 240,
          genre: 'Ambient'
        }
      ])
      .execute();

    const result = await getGameById(game.id);

    expect(result).not.toBeNull();
    expect(result!.songs).toHaveLength(2);
    expect(result!.songs[0].title).toEqual('Epic Game Song');
    expect(result!.songs[0].game_id).toEqual(game.id);
    expect(result!.songs[0].duration_seconds).toEqual(180);
    expect(result!.songs[1].title).toEqual('Chill Game Theme');
    expect(result!.songs[1].genre).toEqual('Ambient');
  });

  it('should return game with categories', async () => {
    // Create game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Strategy Game',
        description: 'A strategic board game',
        rules_text: 'Complex strategy rules',
        min_players: 2,
        max_players: 6,
        playtime_minutes: 120,
        age_rating: 14,
        complexity_rating: '4.2'
      })
      .returning()
      .execute();

    const game = gameResult[0];

    // Create categories
    const categoriesResult = await db.insert(gameCategoriesTable)
      .values([
        {
          name: 'Strategy',
          description: 'Strategic thinking games'
        },
        {
          name: 'War',
          description: 'Military themed games'
        }
      ])
      .returning()
      .execute();

    // Link game to categories
    await db.insert(gameCategoryRelationsTable)
      .values([
        {
          game_id: game.id,
          category_id: categoriesResult[0].id
        },
        {
          game_id: game.id,
          category_id: categoriesResult[1].id
        }
      ])
      .execute();

    const result = await getGameById(game.id);

    expect(result).not.toBeNull();
    expect(result!.categories).toHaveLength(2);
    expect(result!.categories.map(c => c.name)).toContain('Strategy');
    expect(result!.categories.map(c => c.name)).toContain('War');
    expect(result!.categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should return complete game with songs and categories', async () => {
    // Create game
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Complete Test Game',
        description: 'Full featured game',
        rules_text: 'Complete rules',
        min_players: 1,
        max_players: 8,
        playtime_minutes: 90,
        age_rating: 10,
        complexity_rating: '2.8',
        amazon_link: 'https://amazon.com/game',
        bol_link: 'https://bol.com/game',
        youtube_tutorial_url: 'https://youtube.com/watch?v=123',
        cover_image_url: 'https://example.com/cover.jpg'
      })
      .returning()
      .execute();

    const game = gameResult[0];

    // Create category
    const categoryResult = await db.insert(gameCategoriesTable)
      .values({
        name: 'Family',
        description: 'Family friendly games'
      })
      .returning()
      .execute();

    // Link category
    await db.insert(gameCategoryRelationsTable)
      .values({
        game_id: game.id,
        category_id: categoryResult[0].id
      })
      .execute();

    // Create song
    await db.insert(songsTable)
      .values({
        game_id: game.id,
        title: 'Family Fun Theme',
        suno_track_id: 'suno_family',
        audio_url: 'https://example.com/family.mp3',
        duration_seconds: 150
      })
      .execute();

    const result = await getGameById(game.id);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Complete Test Game');
    expect(result!.complexity_rating).toEqual(2.8);
    expect(result!.amazon_link).toEqual('https://amazon.com/game');
    expect(result!.youtube_tutorial_url).toEqual('https://youtube.com/watch?v=123');
    expect(result!.songs).toHaveLength(1);
    expect(result!.songs[0].title).toEqual('Family Fun Theme');
    expect(result!.categories).toHaveLength(1);
    expect(result!.categories[0].name).toEqual('Family');
  });

  it('should handle nullable fields correctly', async () => {
    // Create game with some null fields
    const gameResult = await db.insert(gamesTable)
      .values({
        name: 'Minimal Game',
        description: 'Basic game',
        rules_text: 'Simple rules',
        min_players: 2,
        max_players: 2,
        playtime_minutes: 30,
        age_rating: 8,
        complexity_rating: '1.0',
        bgg_id: null,
        bgg_rating: null,
        bgg_rank: null,
        amazon_link: null,
        bol_link: null,
        youtube_tutorial_url: null,
        cover_image_url: null
      })
      .returning()
      .execute();

    const game = gameResult[0];
    const result = await getGameById(game.id);

    expect(result).not.toBeNull();
    expect(result!.bgg_id).toBeNull();
    expect(result!.bgg_rating).toBeNull();
    expect(result!.bgg_rank).toBeNull();
    expect(result!.amazon_link).toBeNull();
    expect(result!.bol_link).toBeNull();
    expect(result!.youtube_tutorial_url).toBeNull();
    expect(result!.cover_image_url).toBeNull();
  });
});
