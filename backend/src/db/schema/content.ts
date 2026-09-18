import { pgTable, text, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";

export const culturalMemories = pgTable("cultural_memories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  titleAssamese: text("title_assamese"),
  category: text("category").notNull(),
  description: text("description"),
  emoji: text("emoji"),
  theme: text("theme"),
});

export const familiarMemories = pgTable("familiar_memories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  titleAssamese: text("title_assamese"),
  titleHindi: text("title_hindi"),
  titleBengali: text("title_bengali"),
  titleKannada: text("title_kannada"),
  location: text("location"),
  emoji: text("emoji"),
  story: text("story").notNull(),
  storyAssamese: text("story_assamese"),
  storyHindi: text("story_hindi"),
  storyBengali: text("story_bengali"),
  storyKannada: text("story_kannada"),
  tags: jsonb("tags").$type<string[]>().default([]),
});

export const memoryCardItems = pgTable("memory_card_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameAssamese: text("name_assamese"),
  nameHindi: text("name_hindi"),
  emoji: text("emoji").notNull(),
  color: text("color"),
});

export const attentionPoolItems = pgTable("attention_pool_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  isRed: boolean("is_red").notNull().default(false),
  colorName: text("color_name"),
});

export const patternSequences = pgTable("pattern_sequences", {
  id: text("id").primaryKey(),
  level: integer("level").notNull(),
  sequence: text("sequence").notNull(),
  correctNextEmoji: text("correct_next_emoji").notNull(),
  correctNextLabel: text("correct_next_label").notNull(),
  optionsEmoji: text("options_emoji").notNull(),
  optionsLabel: text("options_label").notNull(),
  patternRule: text("pattern_rule").notNull(),
});

export const performanceTrends = pgTable("performance_trends", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  accuracy: real("accuracy").notNull(),
  responseTime: real("response_time").notNull(),
  score: real("score").notNull(),
});
