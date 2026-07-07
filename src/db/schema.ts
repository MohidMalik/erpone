import { pgTable, serial, text, timestamp, integer, boolean, doublePrecision, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users table (Firebase Auth ID as Primary Key)
export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Companies table (Separate independent companies under an owner)
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  logo: text('logo'), // Base64 encoded logo image or placeholder
  category: text('category').notNull(), // Digital Agency, Software House, Ecommerce Store, Medical Clinic, Construction, Real Estate, Freelancer, Custom Business
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  website: text('website'),
  taxInfo: text('tax_info'),
  currency: text('currency').notNull().default('USD'),
  country: text('country').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Employees table
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role').notNull(), // Super Admin, Manager, Employee, Accountant
  cnic: text('cnic'), // National ID or passport
  salary: text('salary'), // Salary amount (e.g. "$5,000")
  avatar: text('avatar'), // Base64 or placeholder avatar
  attendance: text('attendance'), // JSON string stores monthly/daily clock logs
  performance: text('performance'), // "Excellent", "Good", "Satisfactory", etc.
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  budget: text('budget'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull().default('Pending'), // Pending, In Progress, Review, Completed, Cancelled
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  notes: text('notes'),
  attachments: text('attachments'), // JSON string array of base64 files/links
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Project Employees (Many-to-Many join table)
export const projectEmployees = pgTable('project_employees', {
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  employeeId: integer('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  {
    pk: primaryKey({ columns: [table.projectId, table.employeeId] }),
  }
]);

// 7. Expenses table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(), // Salary, Rent, Utilities, Marketing, Software, Hosting, Transport, Miscellaneous
  description: text('description'),
  date: text('date').notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Income table
export const income = pgTable('income', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  amount: doublePrecision('amount').notNull(),
  source: text('source').notNull(), // Client Payments, Product Sales, Services, Other Income
  description: text('description'),
  date: text('date').notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  assignedTo: integer('assigned_to').references(() => employees.id, { onDelete: 'set null' }),
  priority: text('priority').notNull(), // Low, Medium, High, Urgent
  status: text('status').notNull().default('Pending'), // Pending, Working, Completed
  dueDate: text('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // project, expense, income, task, employee
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Activity Logs (Data Security / Auditing)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.uid, { onDelete: 'set null' }),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// === RELATIONS DEF ===
export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  activityLogs: many(activityLogs),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.ownerId], references: [users.uid] }),
  employees: many(employees),
  clients: many(clients),
  projects: many(projects),
  expenses: many(expenses),
  income: many(income),
  tasks: many(tasks),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, { fields: [employees.companyId], references: [companies.id] }),
  projectLinks: many(projectEmployees),
  tasks: many(tasks),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, { fields: [clients.companyId], references: [companies.id] }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, { fields: [projects.companyId], references: [companies.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  employeeLinks: many(projectEmployees),
  tasks: many(tasks),
}));

export const projectEmployeesRelations = relations(projectEmployees, ({ one }) => ({
  project: one(projects, { fields: [projectEmployees.projectId], references: [projects.id] }),
  employee: one(employees, { fields: [projectEmployees.employeeId], references: [employees.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  company: one(companies, { fields: [expenses.companyId], references: [companies.id] }),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  company: one(companies, { fields: [income.companyId], references: [companies.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  company: one(companies, { fields: [tasks.companyId], references: [companies.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(employees, { fields: [tasks.assignedTo], references: [employees.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  company: one(companies, { fields: [notifications.companyId], references: [companies.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  company: one(companies, { fields: [activityLogs.companyId], references: [companies.id] }),
  user: one(users, { fields: [activityLogs.userId], references: [users.uid] }),
}));
