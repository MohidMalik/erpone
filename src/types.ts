// src/types.ts

export type UserRole = 'Super Admin' | 'Manager' | 'Employee' | 'Accountant';

export interface UserProfile {
  uid: string;
  email: string;
  createdAt?: string;
}

export type BusinessCategory =
  | 'Digital Agency'
  | 'Software House'
  | 'Ecommerce Store'
  | 'Medical Clinic'
  | 'Construction Company'
  | 'Real Estate'
  | 'Freelancer'
  | 'Custom Business';

export interface Company {
  id: number;
  ownerId: string;
  name: string;
  logo: string | null;
  category: BusinessCategory;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  taxInfo: string | null;
  currency: string;
  country: string;
  createdAt?: string;
}

export interface Employee {
  id: number;
  companyId: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  cnic: string | null;
  salary: string | null;
  avatar: string | null;
  attendance: string | null; // JSON String list of attendance dates
  performance: string; // Excellent, Good, Satisfactory, Poor
  createdAt?: string;
}

export interface Client {
  id: number;
  companyId: number;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt?: string;
}

export interface Project {
  id: number;
  companyId: number;
  name: string;
  description: string | null;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Cancelled';
  clientId: number | null;
  notes: string | null;
  attachments: string | null; // JSON list
  assignedEmployeeIds: number[]; // Added via query join
  createdAt?: string;
}

export interface Expense {
  id: number;
  companyId: number;
  amount: number;
  category: 'Salary' | 'Rent' | 'Utilities' | 'Marketing' | 'Software' | 'Hosting' | 'Transport' | 'Miscellaneous';
  description: string | null;
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface Income {
  id: number;
  companyId: number;
  amount: number;
  source: 'Client Payments' | 'Product Sales' | 'Services' | 'Other Income';
  description: string | null;
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface Task {
  id: number;
  companyId: number;
  name: string;
  projectId: number;
  assignedTo: number | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Working' | 'Completed';
  dueDate: string | null;
  createdAt?: string;
}

export interface Notification {
  id: number;
  companyId: number;
  title: string;
  message: string;
  type: 'project' | 'expense' | 'income' | 'task' | 'employee';
  isRead: boolean;
  createdAt?: string;
}

export interface ActivityLog {
  id: number;
  companyId: number | null;
  userId: string | null;
  action: string;
  details: string | null;
  createdAt?: string;
}

// Complete aggregate state loaded for a single company
export interface CompanyData {
  company: Company;
  employees: Employee[];
  clients: Client[];
  projects: Project[];
  expenses: Expense[];
  income: Income[];
  tasks: Task[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
}
