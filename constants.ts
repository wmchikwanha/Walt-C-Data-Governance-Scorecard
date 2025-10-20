import { Dimension, ResponseValue } from './types';

export const DEFAULT_DIMENSIONS_DATA: Dimension[] = [
  {
    id: 1,
    name: 'Do We Know the Rules?',
    subQuestions: [
      { id: 1, text: 'Have 80%+ of staff completed mandatory data governance training in the last 12 months?' },
      { id: 2, text: 'Are relevant industry and sector data regulations documented and accessible to all staff?' },
      { id: 3, text: 'Is there a Data Risk Register that is reviewed at least quarterly?' },
      { id: 4, text: 'Are new staff onboarded with data governance training within their first month?' },
      { id: 5, text: 'Do staff know who to contact for data governance questions?' },
    ],
  },
  {
    id: 2,
    name: 'What Data Do We Have?',
    subQuestions: [
      { id: 1, text: 'Do you have an up-to-date inventory of all digital data records your department holds?' },
      { id: 2, text: 'Do you have an up-to-date inventory of all physical data records your department holds?' },
      { id: 3, text: 'Are retention schedules defined for all data types you hold?' },
      { id: 4, text: 'Are archival schedules defined and followed for data no longer actively used?' },
      { id: 5, text: 'Do you have secure deletion/destruction procedures for data you no longer need?' },
    ],
  },
  {
    id: 3,
    name: 'Where Is Our Data Sitting?',
    subQuestions: [
        { id: 1, text: "Have you listed all systems (cloud, on-premise, 3rd party) where your department's data resides?" },
        { id: 2, text: 'Do you have data flow diagrams showing internal data movement within your department?' },
        { id: 3, text: 'Do you have data flow diagrams showing external data flows (data leaving your department)?' },
        { id: 4, text: 'Are external parties you share data with assessed for their data governance standards?' },
        { id: 5, text: 'Do you know where backup copies of your data are stored?' },
    ],
  },
  {
    id: 4,
    name: 'Who Owns What Data?',
    subQuestions: [
        { id: 1, text: 'Is there a named data owner/steward for each major data asset in your department?' },
        { id: 2, text: 'Do data owners have documented responsibilities and authority?' },
        { id: 3, text: 'Do data owners have the resources and training to fulfill their role?' },
        { id: 4, text: 'Is data ownership information easily accessible to staff who need it?' },
        { id: 5, text: 'Are data ownership assignments reviewed annually?' },
    ],
  },
  {
    id: 5,
    name: 'Who Can Access Our Data?',
    subQuestions: [
        { id: 1, text: 'Are all data assets classified by sensitivity (e.g., Public, Internal, Confidential)?' },
        { id: 2, text: 'Is access to sensitive data controlled by role-based permissions?' },
        { id: 3, text: 'Are access permissions reviewed at least quarterly to remove inappropriate access?' },
        { id: 4, text: 'Are all access requests formally logged and approved?' },
        { id: 5, text: 'Is there segregation of duties for highly sensitive data (no single person has complete access)?' },
        { id: 6, text: 'Are all data assets classified by sensitivity (e.g., Public, Internal, Confidential)?' },
    ],
  },
  {
    id: 6,
    name: 'How Clean Is Our Data?',
    subQuestions: [
        { id: 1, text: "Are data quality standards defined for your department's key data assets?" },
        { id: 2, text: 'Do you have processes to measure data quality (accuracy, completeness, consistency)?' },
        { id: 3, text: 'Are data quality issues tracked and logged?' },
        { id: 4, text: 'Are there defined processes for remediating data quality issues?' },
        { id: 5, text: 'Is data quality reviewed regularly (at least quarterly)?' },
    ],
  },
  {
    id: 7,
    name: 'Are We Processing It Ethically?',
    subQuestions: [
        { id: 1, text: 'Do you conduct Data Protection Impact Assessments (DPIAs) for new data processing activities?' },
        { id: 2, text: 'Are privacy and ethical considerations reviewed for all new technology initiatives?' },
        { id: 3, text: 'Do you apply Data Protection by Design principles in new systems/processes?' },
        { id: 4, text: 'Do you have clear procedures for responding to data breaches or incidents?' },
        { id: 5, text: 'Can data subjects (people whose data you hold) easily exercise their rights (access, correction, deletion)?' },
    ],
  },
];

export const RESPONSE_POINTS: Record<ResponseValue, number> = {
  [ResponseValue.YES]: 100,
  [ResponseValue.WIP]: 50,
  [ResponseValue.NO]: 0,
  [ResponseValue.UNANSWERED]: 0
};

export const SCORE_COLORS = {
    GREEN: '#28a745',
    AMBER: '#ffc107',
    RED: '#dc3545',
    GRAY: '#e0e0e0'
};

export const SCORE_COLOR_CLASSES = {
    GREEN: 'bg-status-green',
    AMBER: 'bg-status-amber',
    RED: 'bg-status-red',
    GRAY: 'bg-slate-300'
};

export const getScoreAndColor = (score: number | null) => {
    if (score === null || isNaN(score)) {
        return { score: 0, color: SCORE_COLORS.GRAY, colorClass: SCORE_COLOR_CLASSES.GRAY };
    }
    if (score >= 80) {
        return { score, color: SCORE_COLORS.GREEN, colorClass: SCORE_COLOR_CLASSES.GREEN };
    }
    if (score >= 50) {
        return { score, color: SCORE_COLORS.AMBER, colorClass: SCORE_COLOR_CLASSES.AMBER };
    }
    return { score, color: SCORE_COLORS.RED, colorClass: SCORE_COLOR_CLASSES.RED };
};