// src/db/queries.ts
import { db } from './index.ts';
import {
  users,
  companies,
  employees,
  clients,
  projects,
  projectEmployees,
  expenses,
  income,
  tasks,
  notifications,
  activityLogs
} from './schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

// Error helper to sanitize and wrap db errors
function handleDbError(operationName: string, error: any): never {
  console.error(`Database error during [${operationName}]:`, error);
  throw new Error(`Database operation [${operationName}] failed. Please try again later.`, { cause: error });
}

// === USER QUERIES ===
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({ uid, email })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();
    return result[0];
  } catch (error) {
    handleDbError('getOrCreateUser', error);
  }
}

// === COMPANY QUERIES ===
export async function getCompanies(userId: string) {
  try {
    return await db.select()
      .from(companies)
      .where(eq(companies.ownerId, userId))
      .orderBy(desc(companies.createdAt));
  } catch (error) {
    handleDbError('getCompanies', error);
  }
}

export async function createCompany(userId: string, data: {
  name: string;
  logo?: string;
  category: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  taxInfo?: string;
  currency: string;
  country: string;
}) {
  try {
    const result = await db.insert(companies)
      .values({
        ownerId: userId,
        name: data.name,
        logo: data.logo || null,
        category: data.category,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        website: data.website || null,
        taxInfo: data.taxInfo || null,
        currency: data.currency || 'USD',
        country: data.country,
      })
      .returning();
    
    // Create automatic initial notification
    await db.insert(notifications).values({
      companyId: result[0].id,
      title: 'Company Created',
      message: `Welcome to ${data.name}! Your dashboard is ready.`,
      type: 'employee',
    });

    // Create activity log
    await db.insert(activityLogs).values({
      companyId: result[0].id,
      userId: userId,
      action: 'Create Company',
      details: `Created company ${data.name} with category ${data.category}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('createCompany', error);
  }
}

export async function updateCompany(companyId: number, userId: string, data: {
  name: string;
  logo?: string;
  category: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  taxInfo?: string;
  currency: string;
  country: string;
}) {
  try {
    // Security check: ensure user owns company
    const check = await db.select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.ownerId, userId)));
    if (!check.length) {
      throw new Error("Unauthorized or company not found.");
    }

    const result = await db.update(companies)
      .set({
        name: data.name,
        logo: data.logo !== undefined ? data.logo : undefined,
        category: data.category,
        phone: data.phone,
        email: data.email,
        address: data.address,
        website: data.website,
        taxInfo: data.taxInfo,
        currency: data.currency,
        country: data.country,
      })
      .where(eq(companies.id, companyId))
      .returning();

    // Log update
    await db.insert(activityLogs).values({
      companyId: companyId,
      userId: userId,
      action: 'Update Company',
      details: `Updated company info for ${data.name}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('updateCompany', error);
  }
}

export async function deleteCompany(companyId: number, userId: string) {
  try {
    // Security check: ensure user owns company
    const check = await db.select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.ownerId, userId)));
    if (!check.length) {
      throw new Error("Unauthorized or company not found.");
    }

    await db.delete(companies)
      .where(eq(companies.id, companyId));

    return { success: true };
  } catch (error) {
    handleDbError('deleteCompany', error);
  }
}

// === MASSIVE FETCH FOR ONE COMPANY (Isolates and returns complete view-data) ===
export async function getCompanyData(companyId: number, userId: string) {
  try {
    // Check ownership
    const companyCheck = await db.select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.ownerId, userId)));
    if (!companyCheck.length) {
      throw new Error("Unauthorized access to company data.");
    }

    const companyInfo = companyCheck[0];

    // Parallel fetch with database isolation for this specific company
    const [
      allEmployees,
      allClients,
      allProjects,
      allExpenses,
      allIncome,
      allTasks,
      allNotifications,
      allLogs,
      allProjectEmployeeLinks
    ] = await Promise.all([
      db.select().from(employees).where(eq(employees.companyId, companyId)).orderBy(desc(employees.createdAt)),
      db.select().from(clients).where(eq(clients.companyId, companyId)).orderBy(desc(clients.createdAt)),
      db.select().from(projects).where(eq(projects.companyId, companyId)).orderBy(desc(projects.createdAt)),
      db.select().from(expenses).where(eq(expenses.companyId, companyId)).orderBy(desc(expenses.createdAt)),
      db.select().from(income).where(eq(income.companyId, companyId)).orderBy(desc(income.createdAt)),
      db.select().from(tasks).where(eq(tasks.companyId, companyId)).orderBy(desc(tasks.createdAt)),
      db.select().from(notifications).where(eq(notifications.companyId, companyId)).orderBy(desc(notifications.createdAt)),
      db.select().from(activityLogs).where(eq(activityLogs.companyId, companyId)).orderBy(desc(activityLogs.createdAt)).limit(100),
      db.select().from(projectEmployees)
        .innerJoin(projects, eq(projectEmployees.projectId, projects.id))
        .where(eq(projects.companyId, companyId))
    ]);

    // Map project-employee links
    const projectEmployeeMap: Record<number, number[]> = {};
    allProjectEmployeeLinks.forEach(link => {
      const pid = link.project_employees.projectId;
      const eid = link.project_employees.employeeId;
      if (!projectEmployeeMap[pid]) {
        projectEmployeeMap[pid] = [];
      }
      projectEmployeeMap[pid].push(eid);
    });

    return {
      company: companyInfo,
      employees: allEmployees,
      clients: allClients,
      projects: allProjects.map(p => ({
        ...p,
        assignedEmployeeIds: projectEmployeeMap[p.id] || []
      })),
      expenses: allExpenses,
      income: allIncome,
      tasks: allTasks,
      notifications: allNotifications,
      activityLogs: allLogs
    };
  } catch (error) {
    handleDbError('getCompanyData', error);
  }
}

// === OPERATIONS FOR SUB-RESOURCES ===

// Employees
export async function createEmployee(userId: string, companyId: number, data: any) {
  try {
    const result = await db.insert(employees).values({
      companyId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      cnic: data.cnic || null,
      salary: data.salary || null,
      avatar: data.avatar || null,
      attendance: JSON.stringify(data.attendance || []),
      performance: data.performance || 'Satisfactory',
    }).returning();

    await db.insert(notifications).values({
      companyId,
      title: 'New Employee Added',
      message: `Employee ${data.name} has been onboarded as ${data.role}.`,
      type: 'employee',
    });

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Create Employee',
      details: `Added employee ${data.name} with role ${data.role}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('createEmployee', error);
  }
}

export async function updateEmployee(userId: string, companyId: number, employeeId: number, data: any) {
  try {
    const result = await db.update(employees).set({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      cnic: data.cnic,
      salary: data.salary,
      avatar: data.avatar,
      attendance: data.attendance ? JSON.stringify(data.attendance) : undefined,
      performance: data.performance,
    }).where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId))).returning();

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Update Employee',
      details: `Updated employee profile for ${data.name}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('updateEmployee', error);
  }
}

export async function deleteEmployee(userId: string, companyId: number, employeeId: number) {
  try {
    await db.delete(employees).where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));
    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Delete Employee',
      details: `Deleted employee ID ${employeeId}`,
    });
    return { success: true };
  } catch (error) {
    handleDbError('deleteEmployee', error);
  }
}

// Clients
export async function createClient(userId: string, companyId: number, data: any) {
  try {
    const result = await db.insert(clients).values({
      companyId,
      name: data.name,
      companyName: data.companyName || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    }).returning();

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Create Client',
      details: `Added client ${data.name} (${data.companyName || 'Individual'})`,
    });

    return result[0];
  } catch (error) {
    handleDbError('createClient', error);
  }
}

export async function updateClient(userId: string, companyId: number, clientId: number, data: any) {
  try {
    const result = await db.update(clients).set({
      name: data.name,
      companyName: data.companyName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
    }).where(and(eq(clients.id, clientId), eq(clients.companyId, companyId))).returning();

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Update Client',
      details: `Updated client profile for ${data.name}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('updateClient', error);
  }
}

export async function deleteClient(userId: string, companyId: number, clientId: number) {
  try {
    await db.delete(clients).where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)));
    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Delete Client',
      details: `Deleted client ID ${clientId}`,
    });
    return { success: true };
  } catch (error) {
    handleDbError('deleteClient', error);
  }
}

// Projects
export async function createProject(userId: string, companyId: number, data: any) {
  try {
    const result = await db.insert(projects).values({
      companyId,
      name: data.name,
      description: data.description || null,
      budget: data.budget || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: data.status || 'Pending',
      clientId: data.clientId || null,
      notes: data.notes || null,
      attachments: JSON.stringify(data.attachments || []),
    }).returning();

    const newProject = result[0];

    // Handle employee links if specified
    if (data.assignedEmployeeIds && Array.isArray(data.assignedEmployeeIds)) {
      for (const empId of data.assignedEmployeeIds) {
        await db.insert(projectEmployees).values({
          projectId: newProject.id,
          employeeId: empId,
        });
      }
    }

    await db.insert(notifications).values({
      companyId,
      title: 'New Project Assigned',
      message: `Project "${data.name}" has been created with status ${data.status || 'Pending'}.`,
      type: 'project',
    });

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Create Project',
      details: `Created project "${data.name}" with budget ${data.budget || 'N/A'}`,
    });

    return {
      ...newProject,
      assignedEmployeeIds: data.assignedEmployeeIds || []
    };
  } catch (error) {
    handleDbError('createProject', error);
  }
}

export async function updateProject(userId: string, companyId: number, projectId: number, data: any) {
  try {
    const result = await db.update(projects).set({
      name: data.name,
      description: data.description,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      clientId: data.clientId,
      notes: data.notes,
      attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
    }).where(and(eq(projects.id, projectId), eq(projects.companyId, companyId))).returning();

    // Re-assign employees: delete existing first, then insert new
    if (data.assignedEmployeeIds !== undefined && Array.isArray(data.assignedEmployeeIds)) {
      await db.delete(projectEmployees).where(eq(projectEmployees.projectId, projectId));
      for (const empId of data.assignedEmployeeIds) {
        await db.insert(projectEmployees).values({
          projectId,
          employeeId: empId,
        });
      }
    }

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Update Project',
      details: `Updated project details for "${data.name}"`,
    });

    return {
      ...result[0],
      assignedEmployeeIds: data.assignedEmployeeIds || []
    };
  } catch (error) {
    handleDbError('updateProject', error);
  }
}

export async function deleteProject(userId: string, companyId: number, projectId: number) {
  try {
    await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.companyId, companyId)));
    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Delete Project',
      details: `Deleted project ID ${projectId}`,
    });
    return { success: true };
  } catch (error) {
    handleDbError('deleteProject', error);
  }
}

// Expenses
export async function createExpense(userId: string, companyId: number, data: any) {
  try {
    const result = await db.insert(expenses).values({
      companyId,
      amount: parseFloat(data.amount) || 0,
      category: data.category,
      description: data.description || null,
      date: data.date,
    }).returning();

    await db.insert(notifications).values({
      companyId,
      title: 'New Expense Recorded',
      message: `An expense of ${data.amount} was recorded under ${data.category}.`,
      type: 'expense',
    });

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Create Expense',
      details: `Recorded expense of ${data.amount} for ${data.category}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('createExpense', error);
  }
}

export async function updateExpense(userId: string, companyId: number, expenseId: number, data: any) {
  try {
    const result = await db.update(expenses).set({
      amount: parseFloat(data.amount) || 0,
      category: data.category,
      description: data.description,
      date: data.date,
    }).where(and(eq(expenses.id, expenseId), eq(expenses.companyId, companyId))).returning();

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Update Expense',
      details: `Updated expense of ID ${expenseId}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('updateExpense', error);
  }
}

export async function deleteExpense(userId: string, companyId: number, expenseId: number) {
  try {
    await db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.companyId, companyId)));
    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Delete Expense',
      details: `Deleted expense ID ${expenseId}`,
    });
    return { success: true };
  } catch (error) {
    handleDbError('deleteExpense', error);
  }
}

// Income
export async function createIncome(userId: string, companyId: number, data: any) {
  try {
    const result = await db.insert(income).values({
      companyId,
      amount: parseFloat(data.amount) || 0,
      source: data.source,
      description: data.description || null,
      date: data.date,
    }).returning();

    await db.insert(notifications).values({
      companyId,
      title: 'Payment Received',
      message: `Income of ${data.amount} was received from ${data.source}.`,
      type: 'income',
    });

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Create Income',
      details: `Recorded income of ${data.amount} from ${data.source}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('createIncome', error);
  }
}

export async function updateIncome(userId: string, companyId: number, incomeId: number, data: any) {
  try {
    const result = await db.update(income).set({
      amount: parseFloat(data.amount) || 0,
      source: data.source,
      description: data.description,
      date: data.date,
    }).where(and(eq(income.id, incomeId), eq(income.companyId, companyId))).returning();

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Update Income',
      details: `Updated income of ID ${incomeId}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('updateIncome', error);
  }
}

export async function deleteIncome(userId: string, companyId: number, incomeId: number) {
  try {
    await db.delete(income).where(and(eq(income.id, incomeId), eq(income.companyId, companyId)));
    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Delete Income',
      details: `Deleted income ID ${incomeId}`,
    });
    return { success: true };
  } catch (error) {
    handleDbError('deleteIncome', error);
  }
}

// Tasks
export async function createTask(userId: string, companyId: number, data: any) {
  try {
    const result = await db.insert(tasks).values({
      companyId,
      name: data.name,
      projectId: data.projectId,
      assignedTo: data.assignedTo || null,
      priority: data.priority,
      status: data.status || 'Pending',
      dueDate: data.dueDate || null,
    }).returning();

    // Trigger Task deadline reminder or task assigned notification
    await db.insert(notifications).values({
      companyId,
      title: 'Task Assigned',
      message: `New task "${data.name}" assigned under priority: ${data.priority}.`,
      type: 'task',
    });

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Create Task',
      details: `Created task "${data.name}" with priority ${data.priority}`,
    });

    return result[0];
  } catch (error) {
    handleDbError('createTask', error);
  }
}

export async function updateTask(userId: string, companyId: number, taskId: number, data: any) {
  try {
    const result = await db.update(tasks).set({
      name: data.name,
      projectId: data.projectId,
      assignedTo: data.assignedTo,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate,
    }).where(and(eq(tasks.id, taskId), eq(tasks.companyId, companyId))).returning();

    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Update Task',
      details: `Updated task details/status for "${data.name}"`,
    });

    return result[0];
  } catch (error) {
    handleDbError('updateTask', error);
  }
}

export async function deleteTask(userId: string, companyId: number, taskId: number) {
  try {
    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.companyId, companyId)));
    await db.insert(activityLogs).values({
      companyId,
      userId,
      action: 'Delete Task',
      details: `Deleted task ID ${taskId}`,
    });
    return { success: true };
  } catch (error) {
    handleDbError('deleteTask', error);
  }
}

// Notifications Clear/Mark Read
export async function markNotificationsRead(companyId: number, notifId?: number) {
  try {
    if (notifId) {
      await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notifId), eq(notifications.companyId, companyId)));
    } else {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.companyId, companyId));
    }
    return { success: true };
  } catch (error) {
    handleDbError('markNotificationsRead', error);
  }
}
