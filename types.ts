export enum TaskStatus {
  ON_TRACK = '正常',
  AT_RISK = '风险',
  DELAYED = '延期',
  COMPLETED = '已完成'
}

export interface Group {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  groupId: string;
}

export interface DailyLog {
  id: string;
  date: string; // ISO string
  progressSnapshot: number;
  note: string;
}

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  outcome: string; // The defined result
  assignedTo: string; // Member ID
  startDate: string;
  dueDate: string;
  progress: number; // 0-100
  logs: DailyLog[];
  milestones: Milestone[];
}

export interface DashboardStats {
  total: number;
  completed: number;
  delayed: number;
  atRisk: number;
}