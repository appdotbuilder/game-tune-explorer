
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteGame(id: number): Promise<boolean> {
  try {
    const result = await db.delete(gamesTable)
      .where(eq(gamesTable.id, id))
      .execute();

    // Return true if at least one row was deleted
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Game deletion failed:', error);
    throw error;
  }
}
