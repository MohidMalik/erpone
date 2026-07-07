// src/components/ClientsView.tsx
import React, { useState } from 'react';
import { CompanyData, Client } from '../types.ts';
import { auth } from '../lib/firebase.ts';
import {
  User,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  ClipboardList,
  History,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  X
} from 'lucide-react';

interface ClientsViewProps {
  data: CompanyData;
  onRefresh: () => void;
}

export default function ClientsView({ data, onRefresh }: ClientsViewProps) {
  const { company, clients, projects } = data;
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Selection states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setIsFormOpen(true);
  };

  const openEditModal = (cl: Client) => {
    setEditingClient(cl);
    setName(cl.name);
    setCompanyName(cl.companyName || '');
    setEmail(cl.email || '');
    setPhone(cl.phone || '');
    setAddress(cl.address || '');
    setNotes(cl.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await auth.currentUser?.getIdToken();
    const method = editingClient ? 'PUT' : 'POST';
    const endpoint = editingClient
      ? `/api/companies/${company.id}/clients/${editingClient.id}`
      : `/api/companies/${company.id}/clients`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          companyName,
          email,
          phone,
          address,
          notes
        })
      });

      if (!res.ok) throw new Error('Failed to save client');
      setIsFormOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error updating client records');
    }
  };

  const handleDelete = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client? All client project associations will be unassigned.')) return;
    const token = await auth.currentUser?.getIdToken();
    try {
      const res = await fetch(`/api/companies/${company.id}/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSelectedClient(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error deleting client');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,Client Name,Company,Email,Phone,Address,Notes'];
    const rows = clients.map(cl => {
      return `"${cl.id}","${cl.name}","${cl.companyName || ''}","${cl.email || ''}","${cl.phone || ''}","${cl.address || ''}","${cl.notes || ''}"`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name.replace(/\s+/g, '_')}_clients_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClients = clients.filter(cl => {
    return cl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (cl.companyName && cl.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (cl.email && cl.email.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Client project history
  const clientProjects = selectedClient ? projects.filter(p => p.clientId === selectedClient.id) : [];

  return (
    <div className="space-y-6" id="clients-view-root">
      
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm" id="client-toolbar">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" /> Client Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage external partnerships, client portfolios, log specific client demands, and historical projects.</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-clients-csv"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel/CSV
          </button>
          
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-clients-print"
          >
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            id="btn-add-client"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Search Input bar */}
      <div className="relative" id="client-search-bar">
        <Search className="absolute inset-y-0 left-0 pl-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none self-center h-full flex items-center justify-center" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search client index by name, company, or linked email address..."
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Main Clients Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="clients-split">
        
        {/* Clients list cards */}
        <div className={`lg:col-span-${selectedClient ? '7' : '12'} grid grid-cols-1 md:grid-cols-2 gap-4`} id="clients-grid-list">
          {filteredClients.map((cl) => (
            <div
              key={cl.id}
              onClick={() => setSelectedClient(cl)}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start justify-between group ${
                selectedClient?.id === cl.id ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5' : 'border-slate-200 dark:border-slate-800'
              }`}
              id={`client-card-${cl.id}`}
            >
              <div className="flex items-start gap-3.5" id={`client-avatar-meta-${cl.id}`}>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center font-bold border border-blue-100 dark:border-blue-950/55 shrink-0 mt-0.5">
                  {cl.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{cl.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">{cl.companyName || 'Individual Client'}</p>
                  
                  {cl.email && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-2.5">
                      <Mail className="w-3 h-3 text-slate-300" /> {cl.email}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all shrink-0 self-center" />
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400" id="empty-clients">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs">No partners or clients registered inside the database.</p>
            </div>
          )}
        </div>

        {/* Detailed Client card drawer */}
        {selectedClient && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md relative h-fit" id="client-drawer">
            
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              id="btn-close-client-drawer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Meta Info */}
            <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100 dark:border-slate-800" id="client-drawer-hero">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-100 dark:border-blue-950">
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">{selectedClient.name}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedClient.companyName || 'Individual Partner'}</p>
              </div>
            </div>

            {/* Contact Specifics */}
            <div className="py-6 space-y-4 text-xs border-b border-slate-100 dark:border-slate-800" id="client-drawer-specs">
              {selectedClient.email && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="client-spec-email">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-bold w-16">Email:</span>
                  <span>{selectedClient.email}</span>
                </div>
              )}
              {selectedClient.phone && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="client-spec-phone">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-bold w-16">Phone:</span>
                  <span>{selectedClient.phone}</span>
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300" id="client-spec-address">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="font-bold w-16 shrink-0">Address:</span>
                  <span>{selectedClient.address}</span>
                </div>
              )}
              {selectedClient.notes && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80" id="client-spec-notes">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Client Demands & Notes
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{selectedClient.notes}</p>
                </div>
              )}
            </div>

            {/* Historic Projects */}
            <div className="py-6" id="client-drawer-projects">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-4">
                <History className="w-4 h-4 text-emerald-500" /> Associated Project Pipelines
              </h4>
              <div className="space-y-3" id="client-projects-list">
                {clientProjects.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-850/60 flex items-center justify-between" id={`client-proj-${p.id}`}>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Budget: {p.budget || 'N/A'}</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-blue-500/10 text-blue-500">
                      {p.status}
                    </span>
                  </div>
                ))}
                {clientProjects.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">No project pipelines registered for this client yet.</p>
                )}
              </div>
            </div>

            {/* Action controls */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" id="client-drawer-controls">
              <button
                onClick={() => openEditModal(selectedClient)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-edit-client-drawer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Record
              </button>

              <button
                onClick={() => handleDelete(selectedClient.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-delete-client-drawer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Embedded Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="client-form-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg p-6 md:p-8 space-y-6" id="client-form-card">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{editingClient ? 'Edit Client Profile' : 'Register New Client'}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Setup external partner contacts, company metadata, and core notes.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" id="client-form">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zain Malik"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Nexus Corp."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4" id="client-form-grid">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@nexus.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 321 9876543"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street 12, Tech District, USA"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Client Demands & Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prefers agile deliverables, requested bi-weekly milestone evaluations..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4" id="client-form-actions">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  id="btn-cancel-client-form"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                  id="btn-save-client-form"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
