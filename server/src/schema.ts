
import { z } from 'zod';

// Game schema
export const gameSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  rules_text: z.string(),
  min_players: z.number().int(),
  max_players: z.number().int(),
  playtime_minutes: z.number().int(),
  age_rating: z.number().int(),
  complexity_rating: z.number(), // 1-5 scale from BGG
  bgg_id: z.number().int().nullable(), // BoardGameGeek ID
  bgg_rating: z.number().nullable(), // BGG average rating
  bgg_rank: z.number().int().nullable(), // BGG rank
  amazon_link: z.string().url().nullable(),
  bol_link: z.string().url().nullable(),
  youtube_tutorial_url: z.string().url().nullable(),
  cover_image_url: z.string().url().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Game = z.infer<typeof gameSchema>;

// Song schema for custom AI-generated songs
export const songSchema = z.object({
  id: z.number(),
  game_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  suno_track_id: z.string(), // Suno AI track identifier
  audio_url: z.string().url(),
  duration_seconds: z.number().int(),
  genre: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Song = z.infer<typeof songSchema>;

// Song rating schema
export const songRatingSchema = z.object({
  id: z.number(),
  song_id: z.number(),
  user_ip: z.string(), // Simple user identification for now
  rating: z.number().int().min(1).max(5), // 1-5 stars
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SongRating = z.infer<typeof songRatingSchema>;

// Game category schema
export const gameCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type GameCategory = z.infer<typeof gameCategorySchema>;

// Many-to-many relationship for game categories
export const gameCategoryRelationSchema = z.object({
  game_id: z.number(),
  category_id: z.number()
});

export type GameCategoryRelation = z.infer<typeof gameCategoryRelationSchema>;

// Input schemas for creating/updating
export const createGameInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  rules_text: z.string(),
  min_players: z.number().int().positive(),
  max_players: z.number().int().positive(),
  playtime_minutes: z.number().int().positive(),
  age_rating: z.number().int().nonnegative(),
  complexity_rating: z.number().min(1).max(5),
  bgg_id: z.number().int().nullable(),
  amazon_link: z.string().url().nullable(),
  bol_link: z.string().url().nullable(),
  youtube_tutorial_url: z.string().url().nullable(),
  cover_image_url: z.string().url().nullable(),
  category_ids: z.array(z.number()).optional()
});

export type CreateGameInput = z.infer<typeof createGameInputSchema>;

export const updateGameInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  rules_text: z.string().optional(),
  min_players: z.number().int().positive().optional(),
  max_players: z.number().int().positive().optional(),
  playtime_minutes: z.number().int().positive().optional(),
  age_rating: z.number().int().nonnegative().optional(),
  complexity_rating: z.number().min(1).max(5).optional(),
  bgg_id: z.number().int().nullable().optional(),
  amazon_link: z.string().url().nullable().optional(),
  bol_link: z.string().url().nullable().optional(),
  youtube_tutorial_url: z.string().url().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  category_ids: z.array(z.number()).optional()
});

export type UpdateGameInput = z.infer<typeof updateGameInputSchema>;

export const createSongInputSchema = z.object({
  game_id: z.number(),
  title: z.string().min(1),
  description: z.string().nullable(),
  suno_track_id: z.string(),
  audio_url: z.string().url(),
  duration_seconds: z.number().int().positive(),
  genre: z.string().nullable()
});

export type CreateSongInput = z.infer<typeof createSongInputSchema>;

export const rateSongInputSchema = z.object({
  song_id: z.number(),
  user_ip: z.string(),
  rating: z.number().int().min(1).max(5)
});

export type RateSongInput = z.infer<typeof rateSongInputSchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Search and filter schemas
export const gameSearchInputSchema = z.object({
  query: z.string().optional(),
  category_ids: z.array(z.number()).optional(),
  min_players: z.number().int().optional(),
  max_players: z.number().int().optional(),
  min_playtime: z.number().int().optional(),
  max_playtime: z.number().int().optional(),
  min_age: z.number().int().optional(),
  complexity_min: z.number().min(1).max(5).optional(),
  complexity_max: z.number().min(1).max(5).optional(),
  sort_by: z.enum(['name', 'bgg_rating', 'bgg_rank', 'playtime_minutes', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GameSearchInput = z.infer<typeof gameSearchInputSchema>;

// Response schemas with computed fields
export const gameWithSongsSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  rules_text: z.string(),
  min_players: z.number().int(),
  max_players: z.number().int(),
  playtime_minutes: z.number().int(),
  age_rating: z.number().int(),
  complexity_rating: z.number(),
  bgg_id: z.number().int().nullable(),
  bgg_rating: z.number().nullable(),
  bgg_rank: z.number().int().nullable(),
  amazon_link: z.string().url().nullable(),
  bol_link: z.string().url().nullable(),
  youtube_tutorial_url: z.string().url().nullable(),
  cover_image_url: z.string().url().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  songs: z.array(songSchema),
  categories: z.array(gameCategorySchema)
});

export type GameWithSongs = z.infer<typeof gameWithSongsSchema>;

export const songWithRatingSchema = z.object({
  id: z.number(),
  game_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  suno_track_id: z.string(),
  audio_url: z.string().url(),
  duration_seconds: z.number().int(),
  genre: z.string().nullable(),
  created_at: z.coerce.date(),
  average_rating: z.number().nullable(),
  total_ratings: z.number().int()
});

export type SongWithRating = z.infer<typeof songWithRatingSchema>;
