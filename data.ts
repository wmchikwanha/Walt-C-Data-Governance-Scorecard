// FIX: Implemented a mock data API using localStorage to resolve module not found errors.
import {
  User,
  UserRole,
  Assessment,
  Dimension,
  ResponseValue,
  AssessmentTemplate,
  SubQuestionResponse,
  DimensionScore,
  ChangeLogEntry
} from './types';
import { DEFAULT_DIMENSIONS_DATA } from './constants';
import { comparePeriods } from './lib/scoring';

// --- SEED DATA ---

const SEED_USERS: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@example.com', role: UserRole.DEPARTMENT_HEAD, departmentName: 'Sales' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob.w@example.com', role: UserRole.DEPARTMENT_HEAD, departmentName: 'Engineering' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie.b@example.com', role: UserRole.DEPARTMENT_HEAD, departmentName: 'Human Resources' },
  { id: 'user-4', name: 'Diana Prince', email: 'diana.p@example.com', role: UserRole.SENIOR_MANAGEMENT },
  { id: 'user-5', name: 'Edward Nygma', email: 'edward.n@example.com', role: UserRole.ADMINISTRATOR },
];

const SEED_TEMPLATES: AssessmentTemplate[] = [
  {
    id: 'template-default-q1-2024',
    name: 'Q1 2024 Standard Assessment',
    description: 'The standard data governance assessment template for the first quarter of 2024.',
    dimensions: DEFAULT_DIMENSIONS_DATA,
  },
];

const createInitialScores = (dimensions: Dimension[]): DimensionScore[] => {
  return dimensions.map(dim => ({
    dimensionId: dim.id,
    comments: '',
    responses: dim.subQuestions.map(sq => ({
      subQuestionId: sq.id,
      response: ResponseValue.UNANSWERED,
    })),
  }));
};

const createRandomizedScores = (dimensions: Dimension[]): DimensionScore[] => {
    const responses = [ResponseValue.YES, ResponseValue.WIP, ResponseValue.NO];
    return dimensions.map(dim => ({
        dimensionId: dim.id,
        comments: `Some comments for dimension ${dim.id}.`,
        responses: dim.subQuestions.map(sq => ({
            subQuestionId: sq.id,
            response: responses[Math.floor(Math.random() * responses.length)],
        })),
    }));
};

const SEED_ASSESSMENTS: Assessment[] = [
  // Engineering - 2 periods
  {
    id: 'assessment-1',
    departmentName: 'Engineering',
    period: 'Q4 2023',
    status: 'Locked',
    lastSaved: new Date('2023-12-15T10:00:00Z').toISOString(),
    scores: createRandomizedScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-q1-2024',
  },
  {
    id: 'assessment-2',
    departmentName: 'Engineering',
    period: 'Q1 2024',
    status: 'Submitted',
    lastSaved: new Date('2024-03-20T14:30:00Z').toISOString(),
    scores: createRandomizedScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-q1-2024',
  },
  // Sales - 1 period
  {
    id: 'assessment-3',
    departmentName: 'Sales',
    period: 'Q1 2024',
    status: 'Draft',
    lastSaved: new Date().toISOString(),
    scores: createInitialScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-q1-2024',
  },
   // Human Resources - 1 submitted with notes
  {
    id: 'assessment-4',
    departmentName: 'Human Resources',
    period: 'Q1 2024',
    status: 'Submitted',
    lastSaved: new Date('2024-03-18T11:00:00Z').toISOString(),
    scores: createRandomizedScores(DEFAULT_DIMENSIONS_DATA).map((ds, i) => {
        // Make one dimension incomplete
        if (i === 2) {
            return {
                ...ds,
                responses: ds.responses.map(r => ({...r, response: ResponseValue.UNANSWERED}))
            }
        }
        return ds;
    }),
    templateId: 'template-default-q1-2024',
    submissionNotes: 'Submitted incomplete due to key personnel being on leave. Will finalize next quarter.'
  },
];


const SEED_CHANGELOG: ChangeLogEntry[] = [
    {
        id: 'cl-1',
        timestamp: new Date('2023-12-20T09:00:00Z').toISOString(),
        user: 'Diana Prince',
        changeDescription: 'Locked assessment for Engineering',
        period: 'Q4 2023',
    }
];

// --- LOCALSTORAGE DATABASE ---

const db = {
  getItem<T>(key: string, seedData: T[]): T[] {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(key, JSON.stringify(seedData));
      return seedData;
    } catch (e) {
      console.error(`Failed to get item ${key} from localStorage`, e);
      return seedData;
    }
  },
  setItem<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to set item ${key} in localStorage`, e);
    }
  },
};

const DB_KEYS = {
  USERS: 'db_users',
  TEMPLATES: 'db_templates',
  ASSESSMENTS: 'db_assessments',
  CHANGELOG: 'db_changelog',
};

// Initialize DB
db.getItem(DB_KEYS.USERS, SEED_USERS);
db.getItem(DB_KEYS.TEMPLATES, SEED_TEMPLATES);
db.getItem(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
db.getItem(DB_KEYS.CHANGELOG, SEED_CHANGELOG);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API ---

export const api = {
  async getUsers(): Promise<User[]> {
    await delay(300);
    return db.getItem<User>(DB_KEYS.USERS, SEED_USERS);
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
      await delay(500);
      const users = db.getItem<User>(DB_KEYS.USERS, SEED_USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) throw new Error("User not found");
      
      const updatedUser = { ...users[userIndex], ...updates };
      users[userIndex] = updatedUser;
      db.setItem(DB_KEYS.USERS, users);
      return updatedUser;
  },

  async getTemplates(): Promise<AssessmentTemplate[]> {
      await delay(300);
      return db.getItem<AssessmentTemplate>(DB_KEYS.TEMPLATES, SEED_TEMPLATES);
  },

  async getTemplate(templateId: string): Promise<AssessmentTemplate | null> {
      await delay(100);
      const templates = db.getItem<AssessmentTemplate>(DB_KEYS.TEMPLATES, SEED_TEMPLATES);
      return templates.find(t => t.id === templateId) || null;
  },

  async saveTemplate(template: AssessmentTemplate): Promise<AssessmentTemplate> {
      await delay(700);
      const templates = db.getItem<AssessmentTemplate>(DB_KEYS.TEMPLATES, SEED_TEMPLATES);
      const existingIndex = templates.findIndex(t => t.id === template.id);
      if (existingIndex > -1) {
          templates[existingIndex] = template;
      } else {
          templates.push(template);
      }
      db.setItem(DB_KEYS.TEMPLATES, templates);
      return template;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await delay(500);
    const assessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
    if(assessments.some(a => a.templateId === templateId)) {
        throw new Error("Cannot delete template: it is currently in use by one or more assessments.");
    }

    let templates = db.getItem<AssessmentTemplate>(DB_KEYS.TEMPLATES, SEED_TEMPLATES);
    templates = templates.filter(t => t.id !== templateId);
    db.setItem(DB_KEYS.TEMPLATES, templates);
  },
  
  async getAllAssessments(): Promise<Assessment[]> {
    await delay(500);
    return db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
  },

  async getAssessmentForDepartment(departmentName: string): Promise<Assessment | null> {
    await delay(400);
    const allAssessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
    const departmentAssessments = allAssessments
      .filter(a => a.departmentName === departmentName)
      .sort((a,b) => comparePeriods(b.period, a.period));

    if (departmentAssessments.length > 0) {
      return departmentAssessments[0];
    }
    
    // Create new assessment if none exists
    const templates = await this.getTemplates();
    if (templates.length === 0) return null; // Can't create without a template
    const defaultTemplate = templates[0];
    
    const newAssessment: Assessment = {
        id: `assessment-${Date.now()}`,
        departmentName,
        period: "Q1 2024", // Default period for new departments
        status: 'Draft',
        lastSaved: new Date().toISOString(),
        scores: createInitialScores(defaultTemplate.dimensions),
        templateId: defaultTemplate.id,
    };
    allAssessments.push(newAssessment);
    db.setItem(DB_KEYS.ASSESSMENTS, allAssessments);
    return newAssessment;
  },

  async getAssessmentHistoryForDepartment(departmentName: string): Promise<Assessment[]> {
      await delay(400);
      const allAssessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
      return allAssessments
        .filter(a => a.departmentName === departmentName)
        .sort((a,b) => comparePeriods(a.period, b.period));
  },
  
  async saveAssessment(assessment: Assessment): Promise<Assessment> {
      await delay(800);
      let assessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
      const index = assessments.findIndex(a => a.id === assessment.id);
      if (index === -1) {
          throw new Error("Assessment not found");
      }
      assessments[index] = { ...assessment, lastSaved: new Date().toISOString() };
      db.setItem(DB_KEYS.ASSESSMENTS, assessments);
      return assessments[index];
  },
  
  async lockAssessment(assessmentId: string, userName: string): Promise<void> {
    await delay(500);
    let assessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    assessment.status = 'Locked';
    db.setItem(DB_KEYS.ASSESSMENTS, assessments);
    
    const changelog = db.getItem<ChangeLogEntry>(DB_KEYS.CHANGELOG, SEED_CHANGELOG);
    changelog.unshift({
        id: `cl-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: userName,
        changeDescription: `Locked assessment for ${assessment.departmentName}`,
        period: assessment.period,
    });
    db.setItem(DB_KEYS.CHANGELOG, changelog);
  },

  async unlockAssessment(assessmentId: string, userName: string): Promise<void> {
    await delay(500);
    let assessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    assessment.status = 'Draft';
    db.setItem(DB_KEYS.ASSESSMENTS, assessments);

    const changelog = db.getItem<ChangeLogEntry>(DB_KEYS.CHANGELOG, SEED_CHANGELOG);
    changelog.unshift({
        id: `cl-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: userName,
        changeDescription: `Unlocked assessment for ${assessment.departmentName}`,
        period: assessment.period,
    });
    db.setItem(DB_KEYS.CHANGELOG, changelog);
  },

  async deleteAssessment(assessmentId: string, userName: string): Promise<void> {
      await delay(600);
      let assessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
      const assessment = assessments.find(a => a.id === assessmentId);
      if (!assessment) throw new Error("Assessment not found");

      assessments = assessments.filter(a => a.id !== assessmentId);
      db.setItem(DB_KEYS.ASSESSMENTS, assessments);

      const changelog = db.getItem<ChangeLogEntry>(DB_KEYS.CHANGELOG, SEED_CHANGELOG);
      changelog.unshift({
          id: `cl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: userName,
          changeDescription: `Deleted assessment for ${assessment.departmentName}`,
          period: assessment.period,
      });
      db.setItem(DB_KEYS.CHANGELOG, changelog);
  },

  async getChangelogForDepartment(departmentName: string): Promise<ChangeLogEntry[]> {
      await delay(300);
      const changelog = db.getItem<ChangeLogEntry>(DB_KEYS.CHANGELOG, SEED_CHANGELOG);
      // In a real app, you'd filter by department. For this mock, we'll return all changes that mention the dept name.
      return changelog.filter(c => c.changeDescription.includes(departmentName)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createUser(newUser: Omit<User, 'id'>): Promise<User> {
    await delay(500);
    const users = db.getItem<User>(DB_KEYS.USERS, SEED_USERS);
    const userWithId: User = { ...newUser, id: `user-${Date.now()}` };
    users.push(userWithId);
    db.setItem(DB_KEYS.USERS, users);
    return userWithId;
  },

  async createAssessmentForNewDepartment(departmentName: string, templateId: string, period: string): Promise<Assessment> {
    await delay(200);
    const templates = db.getItem<AssessmentTemplate>(DB_KEYS.TEMPLATES, SEED_TEMPLATES);
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error("Template not found for new department assessment.");
    
    const newAssessment: Assessment = {
        id: `assessment-${Date.now()}`,
        departmentName,
        period,
        status: 'Draft',
        lastSaved: new Date().toISOString(),
        scores: createInitialScores(template.dimensions),
        templateId: template.id,
    };

    const assessments = db.getItem<Assessment>(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
    assessments.push(newAssessment);
    db.setItem(DB_KEYS.ASSESSMENTS, assessments);
    return newAssessment;
  }
};