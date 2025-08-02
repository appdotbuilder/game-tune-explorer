
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameCategoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return all categories ordered by name', async () => {
    // Create test categories
    await db.insert(gameCategoriesTable).values([
      {
        name: 'Strategy',
        description: 'Games requiring strategic thinking'
      },
      {
        name: 'Family',
        description: 'Games suitable for families'
      },
      {
        name: 'Abstract',
        description: 'Abstract strategy games'
      }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Should be ordered by name (alphabetically)
    expect(result[0].name).toEqual('Abstract');
    expect(result[1].name).toEqual('Family');
    expect(result[2].name).toEqual('Strategy');

    // Verify all fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle categories with null descriptions', async () => {
    await db.insert(gameCategoriesTable).values({
      name: 'Test Category',
      description: null
    }).execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Category');
    expect(result[0].description).toBeNull();
  });

  it('should return categories with correct field types', async () => {
    await db.insert(gameCategoriesTable).values({
      name: 'Test Category',
      description: 'Test description'
    }).execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];
    
    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(typeof category.description).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);
  });
});
