
import { db } from '../db';
import { gameCategoriesTable } from '../db/schema';
import { type GameCategory } from '../schema';

export const getCategories = async (): Promise<GameCategory[]> => {
  try {
    const result = await db.select()
      .from(gameCategoriesTable)
      .orderBy(gameCategoriesTable.name)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
