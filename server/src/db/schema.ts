
import { serial, text, pgTable, timestamp, numeric, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const gamesTable = pgTable('games', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  rules_text: text('rules_text').notNull(),
  min_players: integer('min_players').notNull(),
  max_players: integer('max_players').notNull(),
  playtime_minutes: integer('playtime_minutes').notNull(),
  age_rating: integer('age_rating').notNull(),
  complexity_rating: numeric('complexity_rating', { precision: 3, scale: 2 }).notNull(),
  bgg_id: integer('bgg_id'), // BoardGameGeek ID
  bgg_rating: numeric('bgg_rating', { precision: 4, scale: 2 }), // BGG average rating
  bgg_rank: integer('bgg_rank'), // BGG rank
  amazon_link: text('amazon_link'),
  bol_link: text('bol_link'),
  youtube_tutorial_url: text('youtube_tutorial_url'),
  cover_image_url: text('cover_image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const songsTable = pgTable('songs', {
  id: serial('id').primaryKey(),
  game_id: integer('game_id').notNull().references(() => gamesTable.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  suno_track_id: varchar('suno_track_id', { length: 100 }).notNull(),
  audio_url: text('audio_url').notNull(),
  duration_seconds: integer('duration_seconds').notNull(),
  genre: varchar('genre', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const songRatingsTable = pgTable('song_ratings', {
  id: serial('id').primaryKey(),
  song_id: integer('song_id').notNull().references(() => songsTable.id, { onDelete: 'cascade' }),
  user_ip: varchar('user_ip', { length: 45 }).notNull(), // IPv6 support
  rating: integer('rating').notNull(), // 1-5 stars
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const gameCategoriesTable = pgTable('game_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const gameCategoryRelationsTable = pgTable('game_category_relations', {
  game_id: integer('game_id').notNull().references(() => gamesTable.id, { onDelete: 'cascade' }),
  category_id: integer('category_id').notNull().references(() => gameCategoriesTable.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.game_id, table.category_id] })
}));

// Relations
export const gamesRelations = relations(gamesTable, ({ many }) => ({
  songs: many(songsTable),
  categoryRelations: many(gameCategoryRelationsTable),
}));

export const songsRelations = relations(songsTable, ({ one, many }) => ({
  game: one(gamesTable, {
    fields: [songsTable.game_id],
    references: [gamesTable.id],
  }),
  ratings: many(songRatingsTable),
}));

export const songRatingsRelations = relations(songRatingsTable, ({ one }) => ({
  song: one(songsTable, {
    fields: [songRatingsTable.song_id],
    references: [songsTable.id],
  }),
}));

export const gameCategoriesRelations = relations(gameCategoriesTable, ({ many }) => ({
  gameRelations: many(gameCategoryRelationsTable),
}));

export const gameCategoryRelationsRelations = relations(gameCategoryRelationsTable, ({ one }) => ({
  game: one(gamesTable, {
    fields: [gameCategoryRelationsTable.game_id],
    references: [gamesTable.id],
  }),
  category: one(gameCategoriesTable, {
    fields: [gameCategoryRelationsTable.category_id],
    references: [gameCategoriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Game = typeof gamesTable.$inferSelect;
export type NewGame = typeof gamesTable.$inferInsert;
export type Song = typeof songsTable.$inferSelect;
export type NewSong = typeof songsTable.$inferInsert;
export type SongRating = typeof songRatingsTable.$inferSelect;
export type NewSongRating = typeof songRatingsTable.$inferInsert;
export type GameCategory = typeof gameCategoriesTable.$inferSelect;
export type NewGameCategory = typeof gameCategoriesTable.$inferInsert;
export type GameCategoryRelation = typeof gameCategoryRelationsTable.$inferSelect;
export type NewGameCategoryRelation = typeof gameCategoryRelationsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  games: gamesTable,
  songs: songsTable,
  songRatings: songRatingsTable,
  gameCategories: gameCategoriesTable,
  gameCategoryRelations: gameCategoryRelationsTable,
};
