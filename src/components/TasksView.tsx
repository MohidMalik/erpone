// src/components/TasksView.tsx
import React, { useState } from 'react';
import { CompanyData, Task } from '../types.ts';
import { auth } from '../lib/firebase.ts';
import {
  Target,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Clock,
  Play,
  X
} from 'lucide-react';

interface TasksViewProps {
  data: CompanyData;
  onRefresh: () => void;
}

export default function TasksView({ data, onRefresh }: TasksViewProps) {
  const { company, tasks, projects, employees } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  // Modals / Selection states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [status, setStatus] = useState<'Pending' | 'Working' | 'Completed'>('Pending');
  const [dueDate, setDueDate] = useState('');

  const openAddModal = () => {
    setEditingTask(null);
    setName('');
    setProjectId(projects[0]?.id.toString() || '');
    setAssignedTo('');
    setPriority('Medium');
    setStatus('Pending');
    setDueDate('');
    setIsFormOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setName(t.name);
    setProjectId(t.projectId.toString());
    setAssignedTo(t.assignedTo ? t.assignedTo.toString() : '');
    setPriority(t.priority);
    setStatus(t.status);
    setDueDate(t.dueDate || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      alert('A project must be linked to create a task.');
      return;
    }

    const token = await auth.currentUser?.getIdToken();
    const method = editingTask ? 'PUT' : 'POST';
    const endpoint = editingTask
      ? `/api/companies/${company.id}/tasks/${editingTask.id}`
      : `/api/companies/${company.id}/tasks`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          projectId: parseInt(projectId),
          assignedTo: assignedTo ? parseInt(assignedTo) : null,
          priority,
          status,
          dueDate
        })
      });

      if (!res.ok) throw new Error('Failed to save task');
      setIsFormOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error updating task database');
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const token = await auth.currentUser?.getIdToken();
    try {
      const res = await fetch(`/api/companies/${company.id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error deleting task');
    }
  };

  const handleQuickStatusToggle = async (task: Task) => {
    const nextStatus = task.status === 'Pending' ? 'Working' : task.status === 'Working' ? 'Completed' : 'Pending';
    const token = await auth.currentUser?.getIdToken();
    try {
      const res = await fetch(`/api/companies/${company.id}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: nextStatus
        })
      });
      if (!res.ok) throw new Error('Failed to toggle task status');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,Task,Project,Assignee,Priority,Status,Due Date'];
    const rows = tasks.map(t => {
      const proj = projects.find(p => p.id === t.projectId)?.name || 'N/A';
      const ass = employees.find(e => e.id === t.assignedTo)?.name || 'Unassigned';
      return `"${t.id}","${t.name}","${proj}","${ass}","${t.priority}","${t.status}","${t.dueDate || ''}"`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name.replace(/\s+/g, '_')}_tasks_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'All' || t.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  const getPriorityColor = (pr: string) => {
    switch (pr) {
      case 'Urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Medium': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-400/10 text-slate-500 border-slate-400/20';
    }
  };

  // Divide tasks into columns (Pending, Working, Completed)
  const columns: { name: 'Pending' | 'Working' | 'Completed'; title: string; color: string }[] = [
    { name: 'Pending', title: 'To Do', color: 'border-slate-200 dark:border-slate-800' },
    { name: 'Working', title: 'In Progress', color: 'border-blue-500/20' },
    { name: 'Completed', title: 'Completed', color: 'border-emerald-500/20' }
  ];

  return (
    <div className="space-y-6" id="tasks-view-root">
      
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm" id="task-toolbar">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" /> Operational Tasks Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">Distribute daily tasks across teams, establish priorities, set target timelines, and move tasks across stages.</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-tasks-csv"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel/CSV
          </button>
          
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-tasks-print"
          >
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            id="btn-add-task"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Directory Filter / Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4" id="tasks-filters-row">
        <div className="md:col-span-6 relative">
          <Search className="absolute inset-y-0 left-0 pl-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none self-center h-full flex items-center justify-center" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by name..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="md:col-span-6 flex gap-2 overflow-x-auto pb-1" id="tasks-filters-priority">
          {['All', 'Low', 'Medium', 'High', 'Urgent'].map((pr) => (
            <button
              key={pr}
              onClick={() => setSelectedPriority(pr)}
              className={`px-3 py-2 text-[10px] uppercase font-extrabold tracking-wider rounded-lg transition-all shrink-0 cursor-pointer border ${
                selectedPriority === pr
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Columns Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="kanban-board">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.name);
          return (
            <div key={col.name} className="flex flex-col space-y-4" id={`kanban-col-${col.name}`}>
              {/* Column Title */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80" id={`kanban-col-header-${col.name}`}>
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{col.title}</h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-950 font-extrabold text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-850">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks cards list */}
              <div className="space-y-3 min-h-[400px]" id={`kanban-col-items-${col.name}`}>
                {colTasks.map((task) => {
                  const projName = projects.find(p => p.id === task.projectId)?.name || 'Internal';
                  const assignee = employees.find(e => e.id === task.assignedTo);
                  
                  return (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-3xl shadow-sm space-y-3.5 hover:border-slate-300 dark:hover:border-slate-750 transition-all group"
                      id={`kanban-task-card-${task.id}`}
                    >
                      <div className="flex items-start justify-between" id={`task-meta-${task.id}`}>
                        <span className="text-[9px] font-extrabold text-slate-400 bg-slate-50 dark:bg-slate-950/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850 uppercase tracking-widest truncate max-w-[140px]" title={projName}>
                          {projName}
                        </span>
                        
                        <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider rounded-lg font-bold border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-850 dark:text-white leading-snug">{task.name}</h4>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-850/60" id={`task-footer-${task.id}`}>
                        <div className="flex items-center gap-1.5" id={`task-assignee-${task.id}`}>
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[100px]">{assignee ? assignee.name : 'Unassigned'}</span>
                        </div>

                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400" id={`task-due-${task.id}`}>
                            <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span>{task.dueDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Micro actions row */}
                      <div className="pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" id={`task-actions-${task.id}`}>
                        <button
                          onClick={() => handleQuickStatusToggle(task)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-1 cursor-pointer"
                          title="Advance Stage"
                          id={`btn-task-advance-${task.id}`}
                        >
                          <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" /> Advance
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 hover:text-blue-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                            id={`btn-task-edit-${task.id}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 hover:text-red-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                            id={`btn-task-delete-${task.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-3xl p-6 text-center text-slate-400" id={`empty-col-${col.name}`}>
                    <CheckCircle className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                    <p className="text-[10px]">No tasks inside this column.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="task-form-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg p-6 md:p-8 space-y-6" id="task-form-card">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{editingTask ? 'Edit Task Specifications' : 'Assign New Operational Task'}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Allocate task to staff, select linked project pipelines, and set timelines.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs" id="task-form">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Design Landing Page Layout"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="task-form-grid-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link Project *</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assign to Staff Member</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="task-form-grid-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Working">Working</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4" id="task-form-actions">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  id="btn-cancel-task-form"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                  id="btn-save-task-form"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
