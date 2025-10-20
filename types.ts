// FIX: Replaced placeholder content with actual type definitions.
export enum ResponseValue {
  YES = 'Yes',
  WIP = 'Work in Progress',
  NO = 'No',
  UNANSWERED = 'Unanswered'
}

export enum UserRole {
  DEPARTMENT_HEAD = 'Department Head',
  SENIOR_MANAGEMENT = 'Senior Management',
  ADMINISTRATOR = 'Administrator'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentName?: string;
}

export interface SubQuestion {
  id: number;
  text: string;
}

export interface Dimension {
  id: number;
  name: string;
  subQuestions: SubQuestion[];
  retentionPolicy?: string;
}

export interface AssessmentTemplate {
    id: string;
    name: string;
    description: string;
    dimensions: Dimension[];
}

export interface SubQuestionResponse {
  subQuestionId: number;
  response: ResponseValue;
}

export interface DimensionScore {
  dimensionId: number;
  responses: SubQuestionResponse[];
  comments: string;
  overriddenScore?: number;
}

export interface Assessment {
  id:string;
  departmentName: string;
  period: string; // e.g. "Q1 2024"
  status: 'Draft' | 'Submitted' | 'Locked';
  lastSaved: string; // ISO Date string
  scores: DimensionScore[];
  templateId: string;
  submissionNotes?: string;
  duration?: number; // in seconds
  dueDate?: string; // ISO Date string
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string; // ISO Date string
  user: string;
  changeDescription: string;
  period: string;
}

export interface Reminder {
    id: string;
    userId: string;
    assessmentId: string;
    reminderDateTime: string; // ISO Date string
}

export interface ScoreAndColor {
    score: number;
    color: string;
    colorClass: string;
}

export interface HeatmapData {
    departmentName: string;
    assessmentId: string;
    status: 'Draft' | 'Submitted' | 'Locked';
    scores: Map<string, ScoreAndColor>; // Changed from array to map keyed by dimension name
    historicalOverallScores: number[];
    overallScore: number;
    trend: 'improving' | 'declining' | 'stable' | 'new';
}

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export interface AppNotification {
  id: string;
  userId: string;
  senderName: string;
  subject: string;
  message: string;
  timestamp: string; // ISO Date string
  read: boolean;
}