
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { type GameSearchInput, type CreateGameInput, type CreateCategoryInput } from '../schema';
import { searchGames } from '../handlers/search_games';

// Test data
const testGame1: CreateGameInput = {
  name: 'Gloomhaven',
  description: 'A tactical dungeon crawler board game',
  rules_text: 'Complex rules for tactical combat',
  min_players: 1,
  max_players: 4,
  playtime_minutes: 120,
  age_rating: 14,
  complexity_rating: 4.2,
  bgg_id: 174430,
  amazon_link: 'https://amazon.com/gloomhaven',
  bol_link: 'https://bol.com/gloomhaven',
  youtube_tutorial_url: 'https://youtube.com/watch?v=gloomhaven',
  cover_image_url: 'https://example.com/gloomhaven.jpg'
};

const testGame2: CreateGameInput = {
  name: 'Azul',
  description: 'Beautiful tile-laying game with simple rules',
  rules_text: 'Easy to learn tile placement rules',
  min_players: 2,
  max_players: 4,
  playtime_minutes: 45,
  age_rating: 8,
  complexity_rating: 1.8,
  bgg_id: 230802,
  amazon_link: 'https://amazon.com/azul',
  bol_link: 'https://bol.com/azul',
  youtube_tutorial_url: 'https://youtube.com/watch?v=azul',
  cover_image_url: 'https://example.com/azul.jpg'
};

const testGame3: CreateGameInput = {
  name: 'Spirit Island',
  description: 'Cooperative game about defending an island',
  rules_text: 'Complex cooperative gameplay mechanics',
  min_players: 1,
  max_players: 4,
  playtime_minutes: 90,
  age_rating: 13,
  complexity_rating: 4.0,
  bgg_id: 162886,
  amazon_link: null,
  bol_link: null,
  youtube_tutorial_url: null,
  cover_image_url: null
};

const strategyCategory: CreateCategoryInput = {
  name: 'Strategy',
  description: 'Strategic thinking games'
};

const coopCategory: CreateCategoryInput = {
  name: 'Cooperative',
  description: 'Players work together'
};

describe('searchGames', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all games with empty search', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString()
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString()
      }
    ]).execute();

    const input: GameSearchInput = {};
    const results = await searchGames(input);

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('Gloomhaven');
    expect(results[1].name).toEqual('Azul');
    expect(typeof results[0].complexity_rating).toEqual('number');
    expect(results[0].complexity_rating).toEqual(4.2);
  });

  it('should filter by text query', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString()
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString()
      }
    ]).execute();

    const input: GameSearchInput = {
      query: 'gloom'
    };
    const results = await searchGames(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Gloomhaven');
  });

  it('should filter by player count', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString()
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString()
      },
      {
        ...testGame3,
        complexity_rating: testGame3.complexity_rating.toString()
      }
    ]).execute();

    // Search for games that support 1 player
    const input: GameSearchInput = {
      min_players: 1,
      max_players: 1
    };
    const results = await searchGames(input);

    expect(results).toHaveLength(2);
    expect(results.every(game => game.min_players <= 1 && game.max_players >= 1)).toBe(true);
  });

  it('should filter by playtime', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString()
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString()
      }
    ]).execute();

    const input: GameSearchInput = {
      min_playtime: 60,
      max_playtime: 150
    };
    const results = await searchGames(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Gloomhaven');
    expect(results[0].playtime_minutes).toEqual(120);
  });

  it('should filter by complexity rating', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString()
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString()
      }
    ]).execute();

    const input: GameSearchInput = {
      complexity_min: 3.0,
      complexity_max: 5.0
    };
    const results = await searchGames(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Gloomhaven');
    expect(results[0].complexity_rating).toEqual(4.2);
  });

  it('should filter by categories', async () => {
    // Create categories
    const categoryResults = await db.insert(gameCategoriesTable).values([
      strategyCategory,
      coopCategory
    ]).returning().execute();

    const strategyId = categoryResults[0].id;
    const coopId = categoryResults[1].id;

    // Create games
    const gameResults = await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString()
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString()
      }
    ]).returning().execute();

    const game1Id = gameResults[0].id;

    // Associate game 1 with strategy category
    await db.insert(gameCategoryRelationsTable).values({
      game_id: game1Id,
      category_id: strategyId
    }).execute();

    const input: GameSearchInput = {
      category_ids: [strategyId]
    };
    const results = await searchGames(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Gloomhaven');
  });

  it('should sort games correctly', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString(),
        bgg_rating: '8.8'
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString(),
        bgg_rating: '7.9'
      }
    ]).execute();

    const input: GameSearchInput = {
      sort_by: 'bgg_rating',
      sort_order: 'desc'
    };
    const results = await searchGames(input);

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('Gloomhaven');
    expect(results[1].name).toEqual('Azul');
    expect(results[0].bgg_rating).toEqual(8.8);
    expect(typeof results[0].bgg_rating).toEqual('number');
  });

  it('should handle pagination', async () => {
    // Create test games
    await db.insert(gamesTable).values([
      {
        ...testGame1,
        complexity_rating: testGame1.complexity_rating.toString()
      },
      {
        ...testGame2,
        complexity_rating: testGame2.complexity_rating.toString()
      },
      {
        ...testGame3,
        complexity_rating: testGame3.complexity_rating.toString()
      }
    ]).execute();

    const input: GameSearchInput = {
      limit: 2,
      offset: 1
    };
    const results = await searchGames(input);

    expect(results).toHaveLength(2);
  });
});
