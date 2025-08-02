
import { db } from '../db';
import { gameCategoriesTable } from '../db/schema';
import { type CreateCategoryInput, type GameCategory } from '../schema';

export const createCategory = async (input: CreateCategoryInput): Promise<GameCategory> => {
  try {
    // Insert category record
    const result = await db.insert(gameCategoriesTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
