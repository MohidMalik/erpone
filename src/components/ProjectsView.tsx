// src/components/ProjectsView.tsx
import React, { useState } from 'react';
import { CompanyData, Project } from '../types.ts';
import { auth } from '../lib/firebase.ts';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ClipboardList,
  X
} from 'lucide-react';

interface ProjectsViewProps {
  data: CompanyData;
  onRefresh: () => void;
  currencySymbol: string;
}

export default function ProjectsView({ data, onRefresh, currencySymbol }: ProjectsViewProps) {
  const { company, projects, employees, clients } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals / Selection states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Cancelled'>('Pending');
  const [clientId, setClientId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<number[]>([]);

  const openAddModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setBudget('');
    setStartDate('');
    setEndDate('');
    setStatus('Pending');
    setClientId('');
    setNotes('');
    setAssignedEmployeeIds([]);
    setIsFormOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setBudget(p.budget || '');
    setStartDate(p.startDate || '');
    setEndDate(p.endDate || '');
    setStatus(p.status);
    setClientId(p.clientId ? p.clientId.toString() : '');
    setNotes(p.notes || '');
    setAssignedEmployeeIds(p.assignedEmployeeIds || []);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await auth.currentUser?.getIdToken();
    const method = editingProject ? 'PUT' : 'POST';
    const endpoint = editingProject
      ? `/api/companies/${company.id}/projects/${editingProject.id}`
      : `/api/companies/${company.id}/projects`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          budget,
          startDate,
          endDate,
          status,
          clientId: clientId ? parseInt(clientId) : null,
          notes,
          assignedEmployeeIds
        })
      });

      if (!res.ok) throw new Error('Failed to save project');
      setIsFormOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error updating project specifications');
    }
  };

  const handleDelete = async (projId: number) => {
    if (!confirm('Are you sure you want to delete this project pipeline? All associated tasks will be removed.')) return;
    const token = await auth.currentUser?.getIdToken();
    try {
      const res = await fetch(`/api/companies/${company.id}/projects/${projId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSelectedProject(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error deleting project');
    }
  };

  const handleEmployeeToggle = (empId: number) => {
    setAssignedEmployeeIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,Project Name,Budget,Timeline,Status,Client,Assigned Team'];
    const rows = projects.map(p => {
      const cl = clients.find(c => c.id === p.clientId)?.name || 'N/A';
      const team = p.assignedEmployeeIds.map(id => employees.find(e => e.id === id)?.name || '').filter(Boolean).join('; ');
      return `"${p.id}","${p.name}","${p.budget || ''}","${p.startDate || ''} to ${p.endDate || ''}","${p.status}","${cl}","${team}"`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name.replace(/\s+/g, '_')}_projects_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Review': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6" id="projects-view-root">
      
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm" id="project-toolbar">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-500" /> Project Pipelines
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure business milestones, allocate team members, assign budgets, and watch active progress tracking.</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-projects-csv"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel/CSV
          </button>
          
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-projects-print"
          >
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            id="btn-add-project"
          >
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      </div>

      {/* Directory Filter / Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4" id="projects-search-row">
        <div className="md:col-span-6 relative">
          <Search className="absolute inset-y-0 left-0 pl-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none self-center h-full flex items-center justify-center" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name or objective desc..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="md:col-span-6 flex gap-2 overflow-x-auto pb-1" id="projects-filters">
          {['All', 'Pending', 'In Progress', 'Review', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-2 text-[10px] uppercase font-extrabold tracking-wider rounded-lg transition-all shrink-0 cursor-pointer border ${
                selectedStatus === st
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid / Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="projects-split">
        
        {/* Project list columns */}
        <div className={`lg:col-span-${selectedProject ? '7' : '12'} grid grid-cols-1 md:grid-cols-2 gap-4`} id="projects-grid-list">
          {filteredProjects.map((p) => {
            const clName = clients.find(c => c.id === p.clientId)?.name || 'Individual Client';
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group ${
                  selectedProject?.id === p.id ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5' : 'border-slate-200 dark:border-slate-800'
                }`}
                id={`project-card-${p.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between" id={`project-header-meta-${p.id}`}>
                    <span className="text-[9px] font-extrabold text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-850/80 uppercase tracking-widest">{clName}</span>
                    <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider rounded-lg font-bold border ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{p.name}</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">{p.description || 'No detailed specifications entered.'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-850/60" id={`project-footer-meta-${p.id}`}>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Budget: {p.budget ? `${currencySymbol}${parseFloat(p.budget).toLocaleString()}` : 'N/A'}
                  </span>
                  
                  <div className="flex items-center -space-x-1.5" id="team-bubble-list">
                    {p.assignedEmployeeIds.slice(0, 3).map((id, idx) => {
                      const emp = employees.find(e => e.id === id);
                      if (!emp) return null;
                      return (
                        <div
                          key={id}
                          className="w-5.5 h-5.5 rounded-full border border-white dark:border-slate-900 bg-slate-100 text-slate-800 font-extrabold text-[8px] flex items-center justify-center shrink-0"
                          title={emp.name}
                        >
                          {emp.name.charAt(0)}
                        </div>
                      );
                    })}
                    {p.assignedEmployeeIds.length > 3 && (
                      <div className="w-5.5 h-5.5 rounded-full border border-white dark:border-slate-900 bg-slate-200 text-slate-600 text-[8px] flex items-center justify-center font-bold">
                        +{p.assignedEmployeeIds.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400" id="empty-projects">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs">No project pipelines configured.</p>
            </div>
          )}
        </div>

        {/* Detailed Project Card Drawer */}
        {selectedProject && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md relative h-fit" id="project-drawer">
            
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              id="btn-close-project-drawer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Meta Hero */}
            <div className="pb-6 border-b border-slate-100 dark:border-slate-800" id="project-drawer-header">
              <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider rounded-lg font-bold border inline-block mb-3 ${getStatusColor(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white leading-snug">{selectedProject.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedProject.description || 'No detailed specifications entered.'}</p>
            </div>

            {/* Specs Grid */}
            <div className="py-6 space-y-4 text-xs border-b border-slate-100 dark:border-slate-800" id="project-drawer-specs">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="proj-spec-client">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Client:</span>
                <span>{clients.find(c => c.id === selectedProject.clientId)?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="proj-spec-timeline">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Timeline:</span>
                <span>{selectedProject.startDate || 'N/A'} to {selectedProject.endDate || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="proj-spec-budget">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Budget:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedProject.budget ? `${currencySymbol}${parseFloat(selectedProject.budget).toLocaleString()}` : 'N/A'}
                </span>
              </div>

              {/* Assigned Employees */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Users className="w-4 h-4" /> Allocated Team Members
                </span>
                <div className="flex flex-wrap gap-1.5" id="allocated-team-tags">
                  {selectedProject.assignedEmployeeIds.map((id) => {
                    const emp = employees.find(e => e.id === id);
                    if (!emp) return null;
                    return (
                      <span key={id} className="text-[9px] bg-slate-50 dark:bg-slate-950 font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-lg">
                        {emp.name} ({emp.role.replace('Employee', 'Staff')})
                      </span>
                    );
                  })}
                  {selectedProject.assignedEmployeeIds.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic">No team members allocated to this milestone yet.</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedProject.notes && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80" id="project-spec-notes">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Project Notes
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{selectedProject.notes}</p>
                </div>
              )}
            </div>

            {/* Action controls */}
            <div className="pt-6 flex items-center justify-between" id="project-drawer-controls">
              <button
                onClick={() => openEditModal(selectedProject)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-edit-project-drawer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Project
              </button>

              <button
                onClick={() => handleDelete(selectedProject.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-delete-project-drawer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Embedded Project Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="project-form-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl p-6 md:p-8 space-y-6 my-8" id="project-form-card">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{editingProject ? 'Edit Project Pipeline' : 'Create New Project Pipeline'}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Configure pipeline name, allocations, targets, budget and timeline dates.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs" id="project-form">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NextGen Web Platform"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Objective / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize key targets and milestones..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="form-grid-budget-status">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total Budget</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pipeline Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="form-grid-dates">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="form-grid-allocations">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link Client</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">No linked Client / Internal project</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.companyName || 'Individual'})</option>
                    ))}
                  </select>
                </div>

                {/* Multi selection employees checklist */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Allocate Staff / Team</label>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl max-h-[140px] overflow-y-auto space-y-2">
                    {employees.map(e => (
                      <label key={e.id} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={assignedEmployeeIds.includes(e.id)}
                          onChange={() => handleEmployeeToggle(e.id)}
                          className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span>{e.name} <span className="text-[10px] text-slate-400">({e.role})</span></span>
                      </label>
                    ))}
                    {employees.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">No employees registered inside the system.</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes & Deliverables</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Milestone details, custom client agreements..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4" id="project-form-actions">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  id="btn-cancel-project-form"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                  id="btn-save-project-form"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
