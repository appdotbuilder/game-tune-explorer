
import { db } from '../db';
import { gamesTable, gameCategoryRelationsTable } from '../db/schema';
import { type CreateGameInput, type Game } from '../schema';

export const createGame = async (input: CreateGameInput): Promise<Game> => {
  try {
    // Insert game record
    const result = await db.insert(gamesTable)
      .values({
        name: input.name,
        description: input.description,
        rules_text: input.rules_text,
        min_players: input.min_players,
        max_players: input.max_players,
        playtime_minutes: input.playtime_minutes,
        age_rating: input.age_rating,
        complexity_rating: input.complexity_rating.toString(), // Convert number to string for numeric column
        bgg_id: input.bgg_id,
        amazon_link: input.amazon_link,
        bol_link: input.bol_link,
        youtube_tutorial_url: input.youtube_tutorial_url,
        cover_image_url: input.cover_image_url
      })
      .returning()
      .execute();

    const game = result[0];

    // Handle category associations if provided
    if (input.category_ids && input.category_ids.length > 0) {
      const categoryRelations = input.category_ids.map(categoryId => ({
        game_id: game.id,
        category_id: categoryId
      }));

      await db.insert(gameCategoryRelationsTable)
        .values(categoryRelations)
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...game,
      complexity_rating: parseFloat(game.complexity_rating), // Convert string back to number
      bgg_rating: game.bgg_rating ? parseFloat(game.bgg_rating) : null // Handle nullable numeric
    };
  } catch (error) {
    console.error('Game creation failed:', error);
    throw error;
  }
};
