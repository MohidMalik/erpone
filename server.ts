// server.ts
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Imports with explicit .ts extensions for ESM resolution compliance
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyData,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createClient,
  updateClient,
  deleteClient,
  createProject,
  updateProject,
  deleteProject,
  createExpense,
  updateExpense,
  deleteExpense,
  createIncome,
  updateIncome,
  deleteIncome,
  createTask,
  updateTask,
  deleteTask,
  markNotificationsRead
} from './src/db/queries.ts';

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limits (for logos, attachments)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === API ROUTES ===

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Authenticated User Registration
app.post('/api/auth/register', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || '';
    const user = await getOrCreateUser(uid, email);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMPANIES CRUDS ---

// Get all companies for current user
app.get('/api/companies', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const comps = await getCompanies(uid);
    res.json(comps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new company
app.post('/api/companies', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const company = await createCompany(uid, req.body);
    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update company info
app.put('/api/companies/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const company = await updateCompany(companyId, uid, req.body);
    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete company and all its data
app.delete('/api/companies/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    await deleteCompany(companyId, uid);
    res.json({ success: true, message: 'Company and all associated data deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET COMPREHENSIVE VIEW DATA FOR A SELECTED COMPANY
app.get('/api/companies/:id/data', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const data = await getCompanyData(companyId, uid);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- EMPLOYEES CRUD ---
app.post('/api/companies/:id/employees', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const employee = await createEmployee(uid, companyId, req.body);
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id/employees/:empId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const empId = parseInt(req.params.empId);
    const employee = await updateEmployee(uid, companyId, empId, req.body);
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id/employees/:empId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const empId = parseInt(req.params.empId);
    await deleteEmployee(uid, companyId, empId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- CLIENTS CRUD ---
app.post('/api/companies/:id/clients', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const client = await createClient(uid, companyId, req.body);
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id/clients/:clientId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const clientId = parseInt(req.params.clientId);
    const client = await updateClient(uid, companyId, clientId, req.body);
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id/clients/:clientId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const clientId = parseInt(req.params.clientId);
    await deleteClient(uid, companyId, clientId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECTS CRUD ---
app.post('/api/companies/:id/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const project = await createProject(uid, companyId, req.body);
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id/projects/:projId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const projId = parseInt(req.params.projId);
    const project = await updateProject(uid, companyId, projId, req.body);
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id/projects/:projId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const projId = parseInt(req.params.projId);
    await deleteProject(uid, companyId, projId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- EXPENSES CRUD ---
app.post('/api/companies/:id/expenses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const expense = await createExpense(uid, companyId, req.body);
    res.json(expense);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id/expenses/:expId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const expId = parseInt(req.params.expId);
    const expense = await updateExpense(uid, companyId, expId, req.body);
    res.json(expense);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id/expenses/:expId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const expId = parseInt(req.params.expId);
    await deleteExpense(uid, companyId, expId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- INCOME CRUD ---
app.post('/api/companies/:id/income', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const inc = await createIncome(uid, companyId, req.body);
    res.json(inc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id/income/:incId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const incId = parseInt(req.params.incId);
    const inc = await updateIncome(uid, companyId, incId, req.body);
    res.json(inc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id/income/:incId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const incId = parseInt(req.params.incId);
    await deleteIncome(uid, companyId, incId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- TASKS CRUD ---
app.post('/api/companies/:id/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const task = await createTask(uid, companyId, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id/tasks/:taskId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const taskId = parseInt(req.params.taskId);
    const task = await updateTask(uid, companyId, taskId, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id/tasks/:taskId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const companyId = parseInt(req.params.id);
    const taskId = parseInt(req.params.taskId);
    await deleteTask(uid, companyId, taskId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOTIFICATIONS MARK READ ---
app.post('/api/companies/:id/notifications/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const notifId = req.body.notificationId ? parseInt(req.body.notificationId) : undefined;
    await markNotificationsRead(companyId, notifId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// === VITE OR STATIC CONTENT SERVING ===
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
