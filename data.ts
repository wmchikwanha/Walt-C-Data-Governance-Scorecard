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
  ChangeLogEntry,
  AppNotification
} from './types';
import { DEFAULT_DIMENSIONS_DATA } from './constants';
import { comparePeriods } from './lib/scoring';

// --- SEED DATA ---

const getFutureDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15); // Extended due date for Q4
    return d;
}
const currentQuarterDueDate = getFutureDueDate();


const SEED_USERS: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@example.com', role: UserRole.DEPARTMENT_HEAD, departmentName: 'Sales' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob.w@example.com', role: UserRole.DEPARTMENT_HEAD, departmentName: 'Engineering' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie.b@example.com', role: UserRole.DEPARTMENT_HEAD, departmentName: 'Human Resources' },
  { id: 'user-4', name: 'Diana Prince', email: 'diana.p@example.com', role: UserRole.SENIOR_MANAGEMENT },
  { id: 'user-5', name: 'Edward Nygma', email: 'edward.n@example.com', role: UserRole.ADMINISTRATOR },
];

const SEED_TEMPLATES: AssessmentTemplate[] = [
  {
    id: 'template-default-2025',
    name: 'Standard Assessment 2025',
    description: 'The standard data governance assessment template for 2025.',
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
  // --- Engineering ---
  {
    id: 'assessment-eng-q2-2025',
    departmentName: 'Engineering',
    period: 'Q2 2025',
    status: 'Locked',
    lastSaved: new Date('2025-06-15T10:00:00Z').toISOString(),
    scores: createRandomizedScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-2025',
    duration: 3600 + (Math.random() * 1800),
    dueDate: new Date('2025-06-20T23:59:59Z').toISOString(),
  },
  {
    id: 'assessment-eng-q3-2025',
    departmentName: 'Engineering',
    period: 'Q3 2025',
    status: 'Submitted',
    lastSaved: new Date('2025-09-20T14:30:00Z').toISOString(),
    scores: createRandomizedScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-2025',
    duration: 3200 + (Math.random() * 1200),
    dueDate: new Date('2025-09-22T23:59:59Z').toISOString(),
  },
   {
    id: 'assessment-eng-q4-2025',
    departmentName: 'Engineering',
    period: 'Q4 2025',
    status: 'Draft',
    lastSaved: new Date().toISOString(),
    scores: createInitialScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-2025',
    dueDate: currentQuarterDueDate.toISOString(),
  },

  // --- Sales ---
  {
    id: 'assessment-sales-q3-2025',
    departmentName: 'Sales',
    period: 'Q3 2025',
    status: 'Submitted',
    lastSaved: new Date('2025-09-18T11:00:00Z').toISOString(),
    scores: createRandomizedScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-2025',
    duration: 4100 + (Math.random() * 1500),
    dueDate: new Date('2025-09-20T23:59:59Z').toISOString(),
  },
  {
    id: 'assessment-sales-q4-2025',
    departmentName: 'Sales',
    period: 'Q4 2025',
    status: 'Draft',
    lastSaved: new Date().toISOString(),
    scores: createInitialScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-2025',
    dueDate: currentQuarterDueDate.toISOString(),
  },
  
   // --- Human Resources ---
  {
    id: 'assessment-hr-q3-2025',
    departmentName: 'Human Resources',
    period: 'Q3 2025',
    status: 'Locked',
    lastSaved: new Date('2025-09-18T11:00:00Z').toISOString(),
    scores: createRandomizedScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-2025',
    submissionNotes: 'Submitted as-is while awaiting final legal review on retention policies.',
    duration: 5500 + (Math.random() * 2000), 
    dueDate: new Date('2025-09-20T23:59:59Z').toISOString(),
  },
  {
    id: 'assessment-hr-q4-2025',
    departmentName: 'Human Resources',
    period: 'Q4 2025',
    status: 'Draft',
    lastSaved: new Date().toISOString(),
    scores: createInitialScores(DEFAULT_DIMENSIONS_DATA),
    templateId: 'template-default-2025',
    dueDate: currentQuarterDueDate.toISOString(),
  },
];


const SEED_CHANGELOG: ChangeLogEntry[] = [
    {
        id: 'cl-1',
        timestamp: new Date('2025-06-22T09:00:00Z').toISOString(),
        user: 'Diana Prince',
        changeDescription: 'Locked assessment for Engineering',
        period: 'Q2 2025',
    },
    {
        id: 'cl-2',
        timestamp: new Date('2025-09-25T11:00:00Z').toISOString(),
        user: 'Diana Prince',
        changeDescription: 'Locked assessment for Human Resources',
        period: 'Q3 2025',
    }
];

const SEED_NOTIFICATIONS: AppNotification[] = [
    {
        id: 'notif-1',
        userId: 'user-2', // For Bob Williams (Engineering)
        senderName: 'Diana Prince',
        subject: 'Q4 2025 Assessment Review',
        message: 'Hi Bob, please take a look at the comments on the "How Clean Is Our Data?" dimension and provide feedback by EOD Friday. Thanks!',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        read: false,
    },
    {
        id: 'notif-2',
        userId: 'user-1', // Alice Johnson (Sales)
        senderName: 'System Automation',
        subject: 'Reminder: Assessment Due Soon',
        message: `Your Q4 2025 assessment for the Sales department is due on ${currentQuarterDueDate.toLocaleDateString()}. Please ensure it is submitted on time.`,
        timestamp: new Date().toISOString(),
        read: false,
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
  NOTIFICATIONS: 'db_notifications',
};

// Initialize DB
db.getItem(DB_KEYS.USERS, SEED_USERS);
db.getItem(DB_KEYS.TEMPLATES, SEED_TEMPLATES);
db.getItem(DB_KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
db.getItem(DB_KEYS.CHANGELOG, SEED_CHANGELOG);
db.getItem(DB_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);


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
        period: "Q4 2025", // Default period for new departments
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

  async getAllChangelogEntries(): Promise<ChangeLogEntry[]> {
    await delay(400);
    const changelog = db.getItem<ChangeLogEntry>(DB_KEYS.CHANGELOG, SEED_CHANGELOG);
    return [...changelog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
  },

  // --- Notification API ---

  async getNotificationsForUser(userId: string): Promise<AppNotification[]> {
      await delay(200);
      const allNotifications = db.getItem<AppNotification>(DB_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
      return allNotifications
        .filter(n => n.userId === userId)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createNotification(notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): Promise<AppNotification> {
    await delay(400);
    const notifications = db.getItem<AppNotification>(DB_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const newNotification: AppNotification = {
        ...notificationData,
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
    };
    notifications.unshift(newNotification);
    db.setItem(DB_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  },

  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await delay(100);
    const notifications = db.getItem<AppNotification>(DB_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const updatedNotifications = notifications.map(n => {
        if (n.userId === userId && notificationIds.includes(n.id)) {
            return { ...n, read: true };
        }
        return n;
    });
    db.setItem(DB_KEYS.NOTIFICATIONS, updatedNotifications);
  }
};