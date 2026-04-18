import { db } from "./db";
import {
  groups, assessments, evaluations,
  type Group, type InsertGroup,
  type Assessment, type InsertAssessment,
  type Evaluation, type InsertEvaluation,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createGroup(data: InsertGroup): Group;
  getGroupByToken(token: string): Group | undefined;
  getGroupByEvaluatorToken(token: string): Group | undefined;
  getGroup(id: string): Group | undefined;
  getAllGroups(): Group[];
  deleteGroup(id: string): void;

  getAllAssessments(): Assessment[];
  getAssessmentsByGroup(groupId: string): Assessment[];
  getAssessment(id: string): Assessment | undefined;
  getAssessmentByPmToken(pmToken: string): Assessment | undefined;
  createAssessment(data: InsertAssessment): Assessment;
  deleteAssessment(id: string): void;

  getEvaluationsByGroup(groupId: string): Evaluation[];
  getEvaluationForAssessment(assessmentId: string): Evaluation | undefined;
  createEvaluation(data: InsertEvaluation): Evaluation;
}

export class DatabaseStorage implements IStorage {
  createGroup(data: InsertGroup): Group {
    return db.insert(groups).values(data).returning().get();
  }
  getGroupByToken(token: string): Group | undefined {
    return db.select().from(groups).where(eq(groups.token, token.toUpperCase())).get();
  }
  getGroupByEvaluatorToken(token: string): Group | undefined {
    return db.select().from(groups).where(eq(groups.evaluatorToken, token.toUpperCase())).get();
  }
  getGroup(id: string): Group | undefined {
    return db.select().from(groups).where(eq(groups.id, id)).get();
  }
  getAllGroups(): Group[] {
    return db.select().from(groups).all();
  }
  deleteGroup(id: string): void {
    // Also delete all assessments and evaluations for this group
    db.delete(evaluations).where(eq(evaluations.groupId, id)).run();
    db.delete(assessments).where(eq(assessments.groupId, id)).run();
    db.delete(groups).where(eq(groups.id, id)).run();
  }

  getAllAssessments(): Assessment[] {
    return db.select().from(assessments).all();
  }
  getAssessmentsByGroup(groupId: string): Assessment[] {
    return db.select().from(assessments).where(eq(assessments.groupId, groupId)).all();
  }
  getAssessment(id: string): Assessment | undefined {
    return db.select().from(assessments).where(eq(assessments.id, id)).get();
  }
  getAssessmentByPmToken(pmToken: string): Assessment | undefined {
    return db.select().from(assessments).where(eq(assessments.pmToken, pmToken.toUpperCase())).get();
  }
  createAssessment(data: InsertAssessment): Assessment {
    return db.insert(assessments).values(data).returning().get();
  }
  deleteAssessment(id: string): void {
    db.delete(assessments).where(eq(assessments.id, id)).run();
  }

  getEvaluationsByGroup(groupId: string): Evaluation[] {
    return db.select().from(evaluations).where(eq(evaluations.groupId, groupId)).all();
  }
  getEvaluationForAssessment(assessmentId: string): Evaluation | undefined {
    return db.select().from(evaluations).where(eq(evaluations.assessmentId, assessmentId)).get();
  }
  createEvaluation(data: InsertEvaluation): Evaluation {
    return db.insert(evaluations).values(data).returning().get();
  }
}

export const storage = new DatabaseStorage();
