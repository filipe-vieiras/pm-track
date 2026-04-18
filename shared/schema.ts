import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---- GROUPS ---------------------------------------------------------------
export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),          // PM join token
  evaluatorToken: text("evaluator_token").notNull(), // evaluator password token
  evaluatorName: text("evaluator_name").notNull(),
  evaluatorEmail: text("evaluator_email").notNull().default(""),
  groupName: text("group_name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertGroupSchema = createInsertSchema(groups);
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

// Safe group (never expose evaluatorToken to PM)
export type GroupPublic = Omit<Group, "evaluatorToken">;

// ---- ASSESSMENTS ----------------------------------------------------------
export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  groupId: text("group_id"),
  pmToken: text("pm_token").notNull().default(""), // PM's personal result token
  name: text("name").notNull(),
  date: text("date").notNull(),
  scores: text("scores").notNull(),
  pillarData: text("pillar_data").notNull(),
  levelId: text("level_id").notNull(),
  levelLabel: text("level_label").notNull(),
  pct: real("pct").notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments);
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

// ---- EVALUATIONS ----------------------------------------------------------
export const evaluations = sqliteTable("evaluations", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  assessmentId: text("assessment_id").notNull(),
  evaluatorName: text("evaluator_name").notNull(),
  date: text("date").notNull(),
  scores: text("scores").notNull(),
  pillarData: text("pillar_data").notNull(),
  levelId: text("level_id").notNull(),
  levelLabel: text("level_label").notNull(),
  pct: real("pct").notNull(),
});

export const insertEvaluationSchema = createInsertSchema(evaluations);
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
