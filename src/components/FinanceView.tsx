// src/components/FinanceView.tsx
import React, { useState } from 'react';
import { CompanyData, Income, Expense } from '../types.ts';
import { auth } from '../lib/firebase.ts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ClipboardList,
  X
} from 'lucide-react';

interface FinanceViewProps {
  data: CompanyData;
  onRefresh: () => void;
  currencySymbol: string;
}

export default function FinanceView({ data, onRefresh, currencySymbol }: FinanceViewProps) {
  const { company, income, expenses } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Income' | 'Expenses'>('All');

  // Modals / Selection states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'Income' | 'Expense'>('Income');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const openAddModal = (type: 'Income' | 'Expense') => {
    setFormType(type);
    setEditingRecord(null);
    setAmount('');
    setDescription('');
    setCategory(type === 'Income' ? 'Client Payments' : 'Marketing');
    setDate(new Date().toISOString().split('T')[0]);
    setIsFormOpen(true);
  };

  const openEditModal = (rec: any, type: 'Income' | 'Expense') => {
    setFormType(type);
    setEditingRecord(rec);
    setAmount(rec.amount.toString());
    setDescription(rec.description || '');
    setCategory(type === 'Income' ? rec.source : rec.category);
    setDate(rec.date ? new Date(rec.date).toISOString().split('T')[0] : '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      alert('Please enter a valid numeric amount.');
      return;
    }

    const token = await auth.currentUser?.getIdToken();
    const isEdit = !!editingRecord;
    const method = isEdit ? 'PUT' : 'POST';
    
    // Choose correct endpoints depending on Income vs Expense
    const typePath = formType === 'Income' ? 'income' : 'expenses';
    const endpoint = isEdit
      ? `/api/companies/${company.id}/${typePath}/${editingRecord.id}`
      : `/api/companies/${company.id}/${typePath}`;

    const payload = formType === 'Income'
      ? {
          amount: parseFloat(amount),
          description,
          source: category, // maps category dropdown back to backend 'source' field
          date
        }
      : {
          amount: parseFloat(amount),
          description,
          category,
          date
        };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save financial ledger record');
      setIsFormOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error updating cashflow ledger');
    }
  };

  const handleDelete = async (id: number, type: 'Income' | 'Expense') => {
    if (!confirm(`Are you sure you want to delete this ${type.toLowerCase()} entry?`)) return;
    const token = await auth.currentUser?.getIdToken();
    const typePath = type === 'Income' ? 'income' : 'expenses';
    try {
      const res = await fetch(`/api/companies/${company.id}/${typePath}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error deleting entry');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,Type,Amount,Category,Date,Description'];
    
    const incRows = income.map(i => {
      return `"${i.id}","Income","${i.amount}","${i.source || 'N/A'}","${i.date}","${i.description || ''}"`;
    });

    const expRows = expenses.map(e => {
      return `"${e.id}","Expense","${e.amount}","${e.category || 'N/A'}","${e.date}","${e.description || ''}"`;
    });

    const combinedRows = [...incRows, ...expRows];
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...combinedRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name.replace(/\s+/g, '_')}_ledger_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process unified timeline feed of income and expenses
  const getUnifiedFeed = () => {
    const feedIncome = income.map(i => ({ ...i, type: 'Income' as const, category: i.source }));
    const feedExpenses = expenses.map(e => ({ ...e, type: 'Expense' as const }));
    const feed = [...feedIncome, ...feedExpenses];
    
    // Sort by date descending
    feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return feed.filter(item => {
      const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'All' || item.type === activeTab;
      return matchesSearch && matchesTab;
    });
  };

  const unifiedFeed = getUnifiedFeed();

  // Core metrics
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const cashflowBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6" id="finance-view-root">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm" id="finance-toolbar">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" /> Cashflow Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit operational revenue streams, categorize overhead expenditures, and track margin profitability.</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-finance-csv"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel/CSV
          </button>
          
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            id="btn-finance-print"
          >
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </button>

          <button
            onClick={() => openAddModal('Income')}
            className="px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            id="btn-log-income"
          >
            <Plus className="w-4 h-4" /> Log Revenue
          </button>

          <button
            onClick={() => openAddModal('Expense')}
            className="px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-lg shadow-red-500/10 cursor-pointer"
            id="btn-log-expense"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        </div>
      </div>

      {/* Financial metrics bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="financial-metrics">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="metric-ledger-balance">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ledger Balance</span>
            <h3 className={`text-2xl font-extrabold mt-1 tracking-tight ${cashflowBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {currencySymbol}{cashflowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">Net liquidity in company treasury</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="metric-total-income">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gross Income</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
              {currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Total Inflows logged
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="metric-total-expenses">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Aggregated Expenses</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
              {currencySymbol}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingDown className="w-3.5 h-3.5" /> Total Outflows logged
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Directory Filter / Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4" id="finance-filters-row">
        <div className="md:col-span-6 relative">
          <Search className="absolute inset-y-0 left-0 pl-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none self-center h-full flex items-center justify-center" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cashflow description or category tags..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="md:col-span-6 flex gap-2 overflow-x-auto pb-1" id="finance-tab-filters">
          {['All', 'Income', 'Expenses'].map((tab: any) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[10px] uppercase font-extrabold tracking-wider rounded-lg transition-all shrink-0 cursor-pointer border ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {tab === 'Expenses' ? 'Outflows' : tab === 'Income' ? 'Inflows' : 'Complete Ledger'}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Feed Table list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden" id="cashflow-feed-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                <th className="py-4.5 px-6">Date</th>
                <th className="py-4.5 px-6">Description</th>
                <th className="py-4.5 px-6">Category</th>
                <th className="py-4.5 px-6 text-right">Amount</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs text-slate-700 dark:text-slate-300">
              {unifiedFeed.map((record) => {
                const isIncome = record.type === 'Income';
                return (
                  <tr key={`${record.type}-${record.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors" id={`feed-row-${record.type}-${record.id}`}>
                    <td className="py-4 px-6 font-medium whitespace-nowrap text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" /> {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-850 dark:text-slate-200">{record.description || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-[9px] uppercase tracking-widest font-extrabold bg-slate-50 dark:bg-slate-950/80 rounded-lg border border-slate-100 dark:border-slate-800/85">
                        {record.category || 'General'}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-extrabold text-sm whitespace-nowrap ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isIncome ? '+' : '-'}{currencySymbol}{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(record, record.type)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-blue-500 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                          id={`btn-edit-feed-${record.type}-${record.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.type)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                          id={`btn-delete-feed-${record.type}-${record.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {unifiedFeed.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center text-slate-400 font-medium">
                    No matching cashflow transactions logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Log Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="finance-form-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg p-6 md:p-8 space-y-6" id="finance-form-card">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingRecord ? `Edit ${formType}` : `Log Operational ${formType}`}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Setup numerical amount value and specific categorization.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs" id="finance-form">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Financial Amount *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450 dark:text-slate-500 font-bold">
                    {currencySymbol}
                  </div>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-extrabold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description / Memo *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Milestone 1 payment receipt, cloud hosting server expense..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="finance-form-grid">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {formType === 'Income' ? (
                      <>
                        <option value="Client Payments">Client Payments</option>
                        <option value="Product Sales">Product Sales</option>
                        <option value="Services">Services Provision</option>
                        <option value="Other Income">Other Income</option>
                      </>
                    ) : (
                      <>
                        <option value="Salary">Staff Salary</option>
                        <option value="Rent">Office Rent</option>
                        <option value="Utilities">Utilities & Bills</option>
                        <option value="Marketing">Marketing & Ads</option>
                        <option value="Software">Software & SaaS</option>
                        <option value="Hosting">Hosting / Cloud</option>
                        <option value="Transport">Transport / Logistics</option>
                        <option value="Miscellaneous">Miscellaneous / Overhead</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Billing Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4" id="finance-form-actions">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  id="btn-cancel-finance-form"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                  id="btn-save-finance-form"
                >
                  Save Cashflow Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
