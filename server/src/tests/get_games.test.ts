
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { getGames } from '../handlers/get_games';

describe('getGames', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no games exist', async () => {
    const result = await getGames();
    expect(result).toEqual([]);
  });

  it('should return all games with correct field types', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        name: 'Catan',
        description: 'A strategy game about building settlements',
        rules_text: 'Players collect resources to build roads, settlements, and cities.',
        min_players: 3,
        max_players: 4,
        playtime_minutes: 75,
        age_rating: 10,
        complexity_rating: '2.34',
        bgg_id: 13,
        bgg_rating: '7.2',
        bgg_rank: 25,
        amazon_link: 'https://amazon.com/catan',
        cover_image_url: 'https://example.com/catan.jpg'
      },
      {
        name: 'Ticket to Ride',
        description: 'A railway-themed board game',
        rules_text: 'Players collect train cards to claim railway routes.',
        min_players: 2,
        max_players: 5,
        playtime_minutes: 60,
        age_rating: 8,
        complexity_rating: '1.84',
        bgg_rating: null,
        bgg_rank: null
      }
    ]).execute();

    const result = await getGames();

    expect(result).toHaveLength(2);

    // Test first game
    const catan = result.find(game => game.name === 'Catan');
    expect(catan).toBeDefined();
    expect(catan!.name).toBe('Catan');
    expect(catan!.description).toBe('A strategy game about building settlements');
    expect(catan!.min_players).toBe(3);
    expect(catan!.max_players).toBe(4);
    expect(catan!.playtime_minutes).toBe(75);
    expect(catan!.age_rating).toBe(10);
    expect(typeof catan!.complexity_rating).toBe('number');
    expect(catan!.complexity_rating).toBe(2.34);
    expect(typeof catan!.bgg_rating).toBe('number');
    expect(catan!.bgg_rating).toBe(7.2);
    expect(catan!.bgg_id).toBe(13);
    expect(catan!.bgg_rank).toBe(25);
    expect(catan!.amazon_link).toBe('https://amazon.com/catan');
    expect(catan!.cover_image_url).toBe('https://example.com/catan.jpg');
    expect(catan!.created_at).toBeInstanceOf(Date);
    expect(catan!.updated_at).toBeInstanceOf(Date);

    // Test second game with null values
    const ticket = result.find(game => game.name === 'Ticket to Ride');
    expect(ticket).toBeDefined();
    expect(ticket!.name).toBe('Ticket to Ride');
    expect(typeof ticket!.complexity_rating).toBe('number');
    expect(ticket!.complexity_rating).toBe(1.84);
    expect(ticket!.bgg_rating).toBeNull();
    expect(ticket!.bgg_rank).toBeNull();
    expect(ticket!.bgg_id).toBeNull();
    expect(ticket!.amazon_link).toBeNull();
  });

  it('should return games in creation order', async () => {
    // Create games with slight delay to ensure different timestamps
    await db.insert(gamesTable).values({
      name: 'First Game',
      description: 'First game description',
      rules_text: 'First game rules',
      min_players: 2,
      max_players: 4,
      playtime_minutes: 30,
      age_rating: 8,
      complexity_rating: '2.0'
    }).execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(gamesTable).values({
      name: 'Second Game',
      description: 'Second game description',
      rules_text: 'Second game rules',
      min_players: 1,
      max_players: 2,
      playtime_minutes: 45,
      age_rating: 12,
      complexity_rating: '3.0'
    }).execute();

    const result = await getGames();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First Game');
    expect(result[1].name).toBe('Second Game');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
