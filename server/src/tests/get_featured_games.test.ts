
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, gameCategoriesTable } from '../db/schema';
import { getFeaturedGames } from '../handlers/get_featured_games';

describe('getFeaturedGames', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return featured games with high BGG ratings', async () => {
    // Create test categories first
    const categories = await db.insert(gameCategoriesTable)
      .values([
        { name: 'Strategy', description: 'Strategic games' },
        { name: 'Family', description: 'Family games' }
      ])
      .returning()
      .execute();

    // Create test games with various BGG ratings
    await db.insert(gamesTable)
      .values([
        {
          name: 'Excellent Game',
          description: 'A top-rated game',
          rules_text: 'Rules for excellent game',
          min_players: 2,
          max_players: 4,
          playtime_minutes: 90,
          age_rating: 12,
          complexity_rating: '3.5',
          bgg_id: 1001,
          bgg_rating: '8.5', // High rating - should be featured
          bgg_rank: 15,
          amazon_link: 'https://amazon.com/excellent-game',
          bol_link: null,
          youtube_tutorial_url: null,
          cover_image_url: null
        },
        {
          name: 'Good Game',
          description: 'A decent game',
          rules_text: 'Rules for good game',
          min_players: 1,
          max_players: 6,
          playtime_minutes: 60,
          age_rating: 10,
          complexity_rating: '2.8',
          bgg_id: 1002,
          bgg_rating: '7.2', // Good rating - should be featured
          bgg_rank: 150,
          amazon_link: null,
          bol_link: null,
          youtube_tutorial_url: null,
          cover_image_url: null
        },
        {
          name: 'Average Game',
          description: 'An average game',
          rules_text: 'Rules for average game',
          min_players: 2,
          max_players: 5,
          playtime_minutes: 45,
          age_rating: 8,
          complexity_rating: '2.0',
          bgg_id: 1003,
          bgg_rating: '6.5', // Below threshold - should NOT be featured
          bgg_rank: 500,
          amazon_link: null,
          bol_link: null,
          youtube_tutorial_url: null,
          cover_image_url: null
        },
        {
          name: 'Unrated Game',
          description: 'A game without BGG data',
          rules_text: 'Rules for unrated game',
          min_players: 3,
          max_players: 8,
          playtime_minutes: 120,
          age_rating: 14,
          complexity_rating: '4.0',
          bgg_id: null,
          bgg_rating: null, // No rating - should NOT be featured
          bgg_rank: null,
          amazon_link: null,
          bol_link: null,
          youtube_tutorial_url: null,
          cover_image_url: null
        }
      ])
      .execute();

    const result = await getFeaturedGames();

    // Should return only games with BGG rating >= 7.0
    expect(result).toHaveLength(2);
    
    // Verify all returned games meet criteria
    result.forEach(game => {
      expect(game.bgg_rating).toBeGreaterThanOrEqual(7.0);
      expect(game.bgg_rating).not.toBeNull();
      expect(game.bgg_rank).not.toBeNull();
      expect(typeof game.complexity_rating).toBe('number');
      expect(typeof game.bgg_rating).toBe('number');
    });

    // Should be ordered by BGG rating (highest first)
    expect(result[0].name).toBe('Excellent Game');
    expect(result[0].bgg_rating).toBe(8.5);
    expect(result[1].name).toBe('Good Game');
    expect(result[1].bgg_rating).toBe(7.2);
  });

  it('should limit results to 10 games', async () => {
    // Create more than 10 high-rated games
    const gameData = Array.from({ length: 15 }, (_, i) => ({
      name: `Featured Game ${i + 1}`,
      description: `Description for game ${i + 1}`,
      rules_text: `Rules for game ${i + 1}`,
      min_players: 2,
      max_players: 4,
      playtime_minutes: 60,
      age_rating: 10,
      complexity_rating: '3.0',
      bgg_id: 2000 + i,
      bgg_rating: '7.5', // All above threshold
      bgg_rank: 100 + i,
      amazon_link: null,
      bol_link: null,
      youtube_tutorial_url: null,
      cover_image_url: null
    }));

    await db.insert(gamesTable)
      .values(gameData)
      .execute();

    const result = await getFeaturedGames();

    expect(result).toHaveLength(10); // Should be limited to 10
    
    // All should meet criteria
    result.forEach(game => {
      expect(game.bgg_rating).toBeGreaterThanOrEqual(7.0);
      expect(typeof game.bgg_rating).toBe('number');
    });
  });

  it('should return empty array when no games meet criteria', async () => {
    // Create only low-rated games
    await db.insert(gamesTable)
      .values([
        {
          name: 'Low Rated Game',
          description: 'A poorly rated game',
          rules_text: 'Rules for low rated game',
          min_players: 2,
          max_players: 4,
          playtime_minutes: 30,
          age_rating: 8,
          complexity_rating: '1.5',
          bgg_id: 3001,
          bgg_rating: '5.5', // Below 7.0 threshold
          bgg_rank: 1000,
          amazon_link: null,
          bol_link: null,
          youtube_tutorial_url: null,
          cover_image_url: null
        }
      ])
      .execute();

    const result = await getFeaturedGames();

    expect(result).toHaveLength(0);
  });

  it('should handle games with all required fields', async () => {
    await db.insert(gamesTable)
      .values([
        {
          name: 'Complete Game',
          description: 'A game with all fields',
          rules_text: 'Complete rules text',
          min_players: 1,
          max_players: 8,
          playtime_minutes: 120,
          age_rating: 14,
          complexity_rating: '4.2',
          bgg_id: 4001,
          bgg_rating: '8.1',
          bgg_rank: 25,
          amazon_link: 'https://amazon.com/complete-game',
          bol_link: 'https://bol.com/complete-game',
          youtube_tutorial_url: 'https://youtube.com/watch?v=tutorial',
          cover_image_url: 'https://example.com/cover.jpg'
        }
      ])
      .execute();

    const result = await getFeaturedGames();

    expect(result).toHaveLength(1);
    
    const game = result[0];
    expect(game.name).toBe('Complete Game');
    expect(game.min_players).toBe(1);
    expect(game.max_players).toBe(8);
    expect(game.playtime_minutes).toBe(120);
    expect(game.age_rating).toBe(14);
    expect(game.complexity_rating).toBe(4.2);
    expect(game.bgg_rating).toBe(8.1);
    expect(game.bgg_rank).toBe(25);
    expect(game.amazon_link).toBe('https://amazon.com/complete-game');
    expect(game.created_at).toBeInstanceOf(Date);
    expect(game.updated_at).toBeInstanceOf(Date);
  });
});
