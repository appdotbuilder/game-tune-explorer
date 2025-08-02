
import { db } from '../db';
import { gamesTable, gameCategoryRelationsTable } from '../db/schema';
import { type UpdateGameInput, type Game } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGame = async (input: UpdateGameInput): Promise<Game> => {
  try {
    // First, verify the game exists
    const existingGame = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, input.id))
      .execute();

    if (existingGame.length === 0) {
      throw new Error(`Game with id ${input.id} not found`);
    }

    // Prepare update values, excluding id and category_ids
    const { id, category_ids, ...updateValues } = input;
    
    // Convert numeric fields to strings for database storage
    const dbUpdateValues: any = { ...updateValues };
    if (updateValues.complexity_rating !== undefined) {
      dbUpdateValues.complexity_rating = updateValues.complexity_rating.toString();
    }

    // Add updated_at timestamp
    dbUpdateValues.updated_at = new Date();

    // Update the game record
    const result = await db.update(gamesTable)
      .set(dbUpdateValues)
      .where(eq(gamesTable.id, input.id))
      .returning()
      .execute();

    // Handle category updates if provided
    if (category_ids !== undefined) {
      // Remove existing category relationships
      await db.delete(gameCategoryRelationsTable)
        .where(eq(gameCategoryRelationsTable.game_id, input.id))
        .execute();

      // Add new category relationships
      if (category_ids.length > 0) {
        const categoryRelations = category_ids.map(category_id => ({
          game_id: input.id,
          category_id
        }));

        await db.insert(gameCategoryRelationsTable)
          .values(categoryRelations)
          .execute();
      }
    }

    // Convert numeric fields back to numbers for return
    const updatedGame = result[0];
    return {
      ...updatedGame,
      complexity_rating: parseFloat(updatedGame.complexity_rating),
      bgg_rating: updatedGame.bgg_rating ? parseFloat(updatedGame.bgg_rating) : null
    };
  } catch (error) {
    console.error('Game update failed:', error);
    throw error;
  }
};
