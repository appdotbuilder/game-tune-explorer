
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameCategoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Strategy',
  description: 'Games that require strategic thinking and planning'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Strategy');
    expect(result.description).toEqual('Games that require strategic thinking and planning');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(gameCategoriesTable)
      .where(eq(gameCategoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Strategy');
    expect(categories[0].description).toEqual('Games that require strategic thinking and planning');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create category with null description', async () => {
    const inputWithNullDescription: CreateCategoryInput = {
      name: 'Party Games',
      description: null
    };

    const result = await createCategory(inputWithNullDescription);

    expect(result.name).toEqual('Party Games');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories with different names', async () => {
    const category1 = await createCategory({
      name: 'Strategy',
      description: 'Strategic games'
    });

    const category2 = await createCategory({
      name: 'Family',
      description: 'Family-friendly games'
    });

    expect(category1.id).not.toEqual(category2.id);
    expect(category1.name).toEqual('Strategy');
    expect(category2.name).toEqual('Family');

    // Verify both are saved in database
    const allCategories = await db.select()
      .from(gameCategoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
  });
});
