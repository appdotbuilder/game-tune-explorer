
import { db } from '../db';
import { gamesTable, gameCategoriesTable, gameCategoryRelationsTable } from '../db/schema';
import { type GameSearchInput, type Game } from '../schema';
import { eq, and, gte, lte, ilike, desc, asc, inArray, type SQL } from 'drizzle-orm';

export async function searchGames(input: GameSearchInput): Promise<Game[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Text search across name and description
    if (input.query) {
      conditions.push(
        ilike(gamesTable.name, `%${input.query}%`)
      );
    }

    // Player count filters
    if (input.min_players !== undefined) {
      conditions.push(gte(gamesTable.max_players, input.min_players));
    }

    if (input.max_players !== undefined) {
      conditions.push(lte(gamesTable.min_players, input.max_players));
    }

    // Playtime filters
    if (input.min_playtime !== undefined) {
      conditions.push(gte(gamesTable.playtime_minutes, input.min_playtime));
    }

    if (input.max_playtime !== undefined) {
      conditions.push(lte(gamesTable.playtime_minutes, input.max_playtime));
    }

    // Age rating filter
    if (input.min_age !== undefined) {
      conditions.push(lte(gamesTable.age_rating, input.min_age));
    }

    // Complexity rating filters
    if (input.complexity_min !== undefined) {
      conditions.push(gte(gamesTable.complexity_rating, input.complexity_min.toString()));
    }

    if (input.complexity_max !== undefined) {
      conditions.push(lte(gamesTable.complexity_rating, input.complexity_max.toString()));
    }

    // Category filter - requires join
    if (input.category_ids && input.category_ids.length > 0) {
      conditions.push(inArray(gameCategoryRelationsTable.category_id, input.category_ids));

      // Execute query with join
      const baseQuery = db.select()
        .from(gamesTable)
        .innerJoin(
          gameCategoryRelationsTable,
          eq(gamesTable.id, gameCategoryRelationsTable.game_id)
        );

      const whereQuery = conditions.length > 0
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : baseQuery;

      const sortedQuery = input.sort_by
        ? whereQuery.orderBy(input.sort_order === 'asc' ? asc(gamesTable[input.sort_by]) : desc(gamesTable[input.sort_by]))
        : whereQuery;

      const finalQuery = sortedQuery
        .limit(input.limit || 20)
        .offset(input.offset || 0);

      const results = await finalQuery.execute();

      // Extract game data from joined results and convert numeric fields
      return results.map((result: any) => ({
        ...result.games,
        complexity_rating: parseFloat(result.games.complexity_rating),
        bgg_rating: result.games.bgg_rating ? parseFloat(result.games.bgg_rating) : null
      }));

    } else {
      // Execute query without join
      const baseQuery = db.select().from(gamesTable);

      const whereQuery = conditions.length > 0
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : baseQuery;

      const sortedQuery = input.sort_by
        ? whereQuery.orderBy(input.sort_order === 'asc' ? asc(gamesTable[input.sort_by]) : desc(gamesTable[input.sort_by]))
        : whereQuery;

      const finalQuery = sortedQuery
        .limit(input.limit || 20)
        .offset(input.offset || 0);

      const results = await finalQuery.execute();

      // Convert numeric fields and return
      return results.map((game: any) => ({
        ...game,
        complexity_rating: parseFloat(game.complexity_rating),
        bgg_rating: game.bgg_rating ? parseFloat(game.bgg_rating) : null
      }));
    }

  } catch (error) {
    console.error('Game search failed:', error);
    throw error;
  }
}
