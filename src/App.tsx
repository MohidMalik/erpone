// src/App.tsx
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './lib/firebase.ts';
import { Company, CompanyData } from './types.ts';
import AuthScreen from './components/AuthScreen.tsx';
import SetupWizard from './components/SetupWizard.tsx';
import DashboardView from './components/DashboardView.tsx';
import EmployeesView from './components/EmployeesView.tsx';
import ClientsView from './components/ClientsView.tsx';
import ProjectsView from './components/ProjectsView.tsx';
import TasksView from './components/TasksView.tsx';
import FinanceView from './components/FinanceView.tsx';

import {
  Building2,
  Users,
  Briefcase,
  Target,
  DollarSign,
  Layers,
  Settings,
  Plus,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Building,
  Mail,
  Phone,
  Globe,
  Loader2,
  Sparkles,
  ChevronDown,
  Trash2,
  CheckCircle,
  FileText
} from 'lucide-react';

type SubView = 'Dashboard' | 'Employees' | 'Clients' | 'Projects' | 'Tasks' | 'Finance' | 'Settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Companies & Navigation states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Subview & Sidebar states
  const [activeView, setActiveView] = useState<SubView>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);

  // Mobile Simulator & Viewport states
  const [isSimulatedMobile, setIsSimulatedMobile] = useState(false);
  const [isWindowMobile, setIsWindowMobile] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Monitor screen width to automatically trigger responsive mobile layout
  useEffect(() => {
    const checkMobile = () => {
      setIsWindowMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobileLayout = isWindowMobile || isSimulatedMobile;

  // Wizard state (to create extra companies)
  const [isCreatingNewCompany, setIsCreatingNewCompany] = useState(false);

  // Settings Edit Form States
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editTaxInfo, setEditTaxInfo] = useState('');
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // 1. Observe Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setCompanies([]);
        setCurrentCompanyId(null);
        setCompanyData(null);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Fetch companies owned by user
  const fetchCompanies = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load companies list');
      const data = await res.json();
      setCompanies(data);
      
      // Select first company by default if none is chosen
      if (data.length > 0 && currentCompanyId === null) {
        setCurrentCompanyId(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  // 3. Fetch data for selected company
  const fetchCompanyData = async () => {
    if (!currentCompanyId || !auth.currentUser) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/companies/${currentCompanyId}/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch company operations database');
      const data: CompanyData = await res.json();
      setCompanyData(data);

      // Populate settings form with current state
      setEditName(data.company.name);
      setEditPhone(data.company.phone || '');
      setEditEmail(data.company.email || '');
      setEditAddress(data.company.address || '');
      setEditWebsite(data.company.website || '');
      setEditTaxInfo(data.company.taxInfo || '');
      setEditLogo(data.company.logo || null);
    } catch (err: any) {
      console.error(err);
      setDataError(err.message || 'Error syncing operations ledger.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompanyId) {
      fetchCompanyData();
    }
  }, [currentCompanyId]);

  // Handle new company creation from Wizard
  const handleCompanyCreated = (company: Company) => {
    setCompanies(prev => [...prev, company]);
    setCurrentCompanyId(company.id);
    setIsCreatingNewCompany(false);
    setActiveView('Dashboard');
  };

  // Sign out
  const handleLogout = () => {
    signOut(auth);
  };

  // Update Company profile info
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId || !auth.currentUser) return;
    setIsSavingSettings(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/companies/${currentCompanyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
          website: editWebsite,
          taxInfo: editTaxInfo,
          logo: editLogo
        })
      });

      if (!res.ok) throw new Error('Failed to update company parameters');
      
      // Refresh local lists
      await fetchCompanies();
      await fetchCompanyData();
      alert('Company information updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error updating settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Delete Company
  const handleDeleteCompany = async () => {
    if (!currentCompanyId || !auth.currentUser) return;
    const confirmText = prompt(`Type DELETE to permanently remove "${companyData?.company.name}" and erase all associated operating data. This is irreversible!`);
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled.');
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/companies/${currentCompanyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete company');

      // Clear states
      const remainingCompanies = companies.filter(c => c.id !== currentCompanyId);
      setCompanies(remainingCompanies);
      setCompanyData(null);
      if (remainingCompanies.length > 0) {
        setCurrentCompanyId(remainingCompanies[0].id);
        setActiveView('Dashboard');
      } else {
        setCurrentCompanyId(null);
      }
      alert('Company deleted successfully.');
    } catch (err: any) {
      console.error(err);
      alert('Error deleting company.');
    }
  };

  // Select currency symbol helper
  const getCurrencySymbol = (code?: string) => {
    switch (code) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'PKR': return 'Rs. ';
      case 'INR': return '₹';
      case 'AED': return 'AED ';
      case 'SAR': return 'SR ';
      default: return '$';
    }
  };

  // Loader state for Auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-350" id="auth-loader">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Verifying secure ecosystem credentials...</span>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    return <AuthScreen onAuthSuccess={fetchCompanies} />;
  }

  // Setup Wizard if NO companies
  if (companies.length === 0 || isCreatingNewCompany) {
    return (
      <SetupWizard
        onCompanyCreated={handleCompanyCreated}
        onCancel={companies.length > 0 ? () => setIsCreatingNewCompany(false) : undefined}
      />
    );
  }

  const currencySymbol = getCurrencySymbol(companyData?.company.currency);

  const renderActiveView = () => {
    if (dataLoading && !companyData) {
      return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400" id="view-loader">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
          <p className="text-xs">Fetching company database ledger...</p>
        </div>
      );
    }

    if (!companyData) {
      return (
        <div className="p-8 text-center text-slate-400" id="view-error">
          <p className="text-sm">Failed to retrieve company database ledger.</p>
        </div>
      );
    }

    switch (activeView) {
      case 'Dashboard':
        return <DashboardView data={companyData} currencySymbol={currencySymbol} />;
      case 'Employees':
        return <EmployeesView data={companyData} onRefresh={fetchCompanyData} />;
      case 'Clients':
        return <ClientsView data={companyData} onRefresh={fetchCompanyData} />;
      case 'Projects':
        return <ProjectsView data={companyData} onRefresh={fetchCompanyData} currencySymbol={currencySymbol} />;
      case 'Tasks':
        return <TasksView data={companyData} onRefresh={fetchCompanyData} />;
      case 'Finance':
        return <FinanceView data={companyData} onRefresh={fetchCompanyData} currencySymbol={currencySymbol} />;
      case 'Settings':
        return (
          <div className="space-y-6" id="settings-view">
            
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center justify-between" id="settings-header">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-500" /> Company Parameters & Security
                </h2>
                <p className="text-xs text-slate-400 mt-1">Update registration profiles, website linkages, tax details, and manage destructive erasure tools.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="settings-grid">
              {/* Profile Config */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="edit-profile-card">
                <form onSubmit={handleUpdateCompany} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tax Registration (Tax Info)</label>
                      <input
                        type="text"
                        value={editTaxInfo}
                        onChange={(e) => setEditTaxInfo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email address</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Website URL</label>
                      <input
                        type="url"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Physical Address</label>
                    <textarea
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Logo Base64 / URL</label>
                    <input
                      type="text"
                      value={editLogo || ''}
                      onChange={(e) => setEditLogo(e.target.value || null)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                      id="btn-save-settings"
                    >
                      {isSavingSettings ? 'Saving Changes...' : 'Save Company Profile'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security & Destructive Controls */}
              <div className="lg:col-span-4 space-y-6" id="settings-security-sidebar">
                {/* Meta details */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6" id="meta-details-card">
                  <h3 className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-1.5 mb-3">
                    <Building2 className="w-4 h-4 text-emerald-500" /> Operational Blueprint
                  </h3>
                  <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                    <p>Category: <strong className="text-slate-700 dark:text-white">{companyData.company.category}</strong></p>
                    <p>Currency: <strong className="text-slate-700 dark:text-white">{companyData.company.currency}</strong></p>
                    <p>Country: <strong className="text-slate-700 dark:text-white">{companyData.company.country}</strong></p>
                  </div>
                </div>

                {/* Destructive Deletion */}
                <div className="bg-red-50/40 dark:bg-red-950/5 border border-red-200 dark:border-red-950 rounded-3xl p-6" id="settings-danger-zone">
                  <h3 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-2">
                    <Trash2 className="w-4 h-4" /> Danger Zone
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                    Removing this company deletes the entire operations matrix including registered employees, clients, project budgets, and cashflow records.
                  </p>
                  
                  <button
                    onClick={handleDeleteCompany}
                    className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
                    id="btn-delete-company-destructive"
                  >
                    Delete Company Account
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      default:
        return null;
    }
  };

  // Mobile App Layout Renderer
  const renderMobileApp = () => {
    return (
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden relative" id="mobile-viewport-container">
        
        {/* Mobile Status Bar (Simulated or Real Native Space) */}
        <div className="h-10 pt-3 px-5 flex justify-between items-center text-[10px] font-semibold text-slate-850 dark:text-slate-100 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 shrink-0 z-40">
          <div>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
          <div className="flex items-center gap-1.5">
            {/* Cellular Signal Bars */}
            <div className="flex items-end gap-0.5 h-2">
              <span className="w-0.5 h-1.5 bg-current rounded-xs" />
              <span className="w-0.5 h-2 bg-current rounded-xs" />
              <span className="w-0.5 h-2.5 bg-current rounded-xs" />
              <span className="w-0.5 h-3 bg-current rounded-xs" />
            </div>
            <span className="text-[9px] font-extrabold leading-none">5G</span>
            {/* Wifi Icon */}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a11.5 11.5 0 0116.14 0M1.06 6.06a19.5 19.5 0 0121.88 0" />
            </svg>
            {/* Battery Icon */}
            <div className="w-4.5 h-2.5 rounded-sm border border-current p-[1px] flex items-center relative">
              <div className="h-full w-3.5 bg-emerald-500 rounded-2xs" />
              <div className="absolute -right-[2.5px] top-[1.5px] w-[1.5px] h-[3px] bg-current rounded-r-xs" />
            </div>
          </div>
        </div>

        {/* Mobile App Header */}
        <header className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between shrink-0 z-40" id="mobile-app-header">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Company Logo Switcher */}
            <button
              onClick={() => setIsCompanySelectorOpen(!isCompanySelectorOpen)}
              className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
              id="mobile-logo-switcher"
            >
              {companyData?.company.logo ? (
                <img src={companyData.company.logo} alt="logo" className="w-7 h-7 object-contain bg-white p-0.5" />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  {companyData?.company.name.charAt(0)}
                </div>
              )}
            </button>
            
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                {companyData?.company.name} <ChevronDown className="w-3 h-3 text-slate-400" />
              </h2>
              <p className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-wider">{companyData?.company.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              id="mobile-darkmode-switch"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Company Selector Dropdown Popover */}
        {isCompanySelectorOpen && (
          <div className="absolute top-[82px] left-4 right-4 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 text-xs animate-fade-in" id="mobile-company-popover">
            <div className="max-h-[200px] overflow-y-auto space-y-1 p-1.5">
              {companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => {
                    setCurrentCompanyId(comp.id);
                    setIsCompanySelectorOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentCompanyId === comp.id 
                      ? 'bg-emerald-500 text-white' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {comp.logo ? (
                    <img src={comp.logo} alt="logo" className="w-5 h-5 object-contain rounded bg-white p-0.5" />
                  ) : (
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${
                      currentCompanyId === comp.id ? 'bg-white/20 border-white/30 text-white' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {comp.name.charAt(0)}
                    </div>
                  )}
                  <span className="truncate">{comp.name}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-150 dark:border-slate-800 mt-1.5 p-1.5">
              <button
                onClick={() => {
                  setIsCreatingNewCompany(true);
                  setIsCompanySelectorOpen(false);
                }}
                className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-emerald-500 dark:text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" /> Add Company Profile
              </button>
            </div>
          </div>
        )}

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth" id="mobile-viewport-main">
          {/* Header Banner Inside screen */}
          <div className="mb-4 flex items-center justify-between" id="mobile-screen-title">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Operational Module</span>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">{activeView}</h1>
            </div>
          </div>
          
          {renderActiveView()}
        </main>

        {/* Mobile Slide-Up Bottom Drawer Menu (More) */}
        {isMobileMoreOpen && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end animate-fade-in" onClick={() => setIsMobileMoreOpen(false)} id="mobile-drawer-overlay">
            <div 
              className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-[32px] p-5 pb-8 space-y-5 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
              id="mobile-drawer-sheet"
            >
              {/* Drag handle decoration */}
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-755 rounded-full mx-auto" />

              {/* User credentials */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-850">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-350 font-extrabold text-xs flex items-center justify-center border border-slate-700 shrink-0">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Logged-in Professional</span>
                  <span className="text-xs font-bold text-slate-850 dark:text-white truncate block leading-snug">{user.email}</span>
                </div>
              </div>

              {/* Grid of secondary tools */}
              <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-750 dark:text-slate-300">
                <button
                  onClick={() => {
                    setActiveView('Clients');
                    setIsMobileMoreOpen(false);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 text-left transition-all cursor-pointer ${
                    activeView === 'Clients' 
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10' 
                      : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800'
                  }`}
                >
                  <Building className="w-4.5 h-4.5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold">Partners & Clients</p>
                    <p className="text-[8.5px] text-slate-400 font-medium mt-0.5">Relations ledger</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveView('Tasks');
                    setIsMobileMoreOpen(false);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 text-left transition-all cursor-pointer ${
                    activeView === 'Tasks' 
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10' 
                      : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800'
                  }`}
                >
                  <Target className="w-4.5 h-4.5 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold">Operational Tasks</p>
                    <p className="text-[8.5px] text-slate-400 font-medium mt-0.5">Checklist pipeline</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveView('Settings');
                    setIsMobileMoreOpen(false);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 text-left transition-all cursor-pointer ${
                    activeView === 'Settings' 
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10' 
                      : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800'
                  }`}
                >
                  <Settings className="w-4.5 h-4.5 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold">Company profile</p>
                    <p className="text-[8.5px] text-slate-400 font-medium mt-0.5">Configurations</p>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-3 rounded-2xl border border-red-200 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/5 flex flex-col gap-1.5 text-left text-red-500 cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-500" />
                  <div>
                    <p className="text-xs font-bold text-red-500">Sign Out</p>
                    <p className="text-[8.5px] text-red-400 font-medium mt-0.5">Exit secure workspace</p>
                  </div>
                </button>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold rounded-xl text-[11px] uppercase tracking-wider cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          </div>
        )}

        {/* Sticky Mobile Bottom Navigation Tab Bar */}
        <nav className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-150 dark:border-slate-850 h-[64px] flex items-center justify-around px-2 z-45 shrink-0 select-none pb-1.5 shadow-lg" id="mobile-sticky-navbar">
          {[
            { id: 'Dashboard', label: 'Home', icon: Layers },
            { id: 'Employees', label: 'Staff', icon: Users },
            { id: 'Projects', label: 'Pipelines', icon: Briefcase },
            { id: 'Finance', label: 'Cashflow', icon: DollarSign },
            { id: 'More', label: 'More', icon: Menu }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = tab.id === 'More' ? isMobileMoreOpen : activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'More') {
                    setIsMobileMoreOpen(true);
                  } else {
                    setActiveView(tab.id as SubView);
                    setIsMobileMoreOpen(false);
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
                  isSelected 
                    ? 'text-emerald-500 dark:text-emerald-450' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-305'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isSelected ? 'scale-110 text-emerald-500' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    );
  };

  // 1. Mobile Native Layout Return
  if (isMobileLayout && isWindowMobile) {
    return renderMobileApp();
  }

  // 2. Desktop with Simulated Mobile App Mockup Return
  if (isMobileLayout && isSimulatedMobile) {
    return (
      <div className={`min-h-screen font-sans flex flex-col items-center justify-center transition-colors duration-300 p-4 ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-100 text-slate-800'}`} id="simulator-outer-viewport">
        
        {/* Simulator Top Action Toolbar */}
        <div className="w-full max-w-[390px] mb-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-tight text-slate-500 dark:text-slate-400">ERPOne App Simulator</span>
          </div>
          <button
            onClick={() => setIsSimulatedMobile(false)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer text-emerald-500 hover:text-emerald-600"
          >
            🖥️ Back to Desktop
          </button>
        </div>

        {/* Realistic iPhone Bezel Mockup */}
        <div className="w-[390px] h-[844px] rounded-[55px] border-[12px] border-slate-900 bg-white dark:bg-slate-950 shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-slate-850/30" id="iphone-bezel-frame">
          
          {/* Dynamic Island / Speaker notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6.5 bg-slate-900 rounded-full z-50 flex items-center justify-between px-4">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-850" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/30" />
          </div>

          {/* Volume Mockups */}
          <div className="absolute left-[-12px] top-32 w-[3px] h-12 bg-slate-800 rounded-r-xs" />
          <div className="absolute left-[-12px] top-48 w-[3px] h-12 bg-slate-800 rounded-r-xs" />
          {/* Power Mockup */}
          <div className="absolute right-[-12px] top-40 w-[3px] h-16 bg-slate-800 rounded-l-xs" />

          {/* Screen Content Wrapper */}
          <div className="flex-1 flex flex-col h-full overflow-hidden select-none relative">
            {renderMobileApp()}
          </div>
          
          {/* Bottom Native Gesture Bar Indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900 dark:bg-white/80 rounded-full z-50 pointer-events-none" />
        </div>

        {/* Micro Info Tooltip */}
        <p className="text-[10px] text-slate-400 mt-4 text-center max-w-xs">
          Fully live & synchronized. Drag the viewport or tap tabs inside the simulated mobile screen!
        </p>
      </div>
    );
  }

  // 3. Default Desktop View Layout Return
  return (
    <div className={`min-h-screen font-sans flex text-slate-800 dark:text-slate-200 ${darkMode ? 'dark bg-slate-950' : 'bg-slate-50/60'}`} id="app-viewport">
      
      {/* Sidebar Navigation - Left Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-400 border-r border-slate-900 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="app-sidebar"
      >
        <div className="flex flex-col h-full" id="sidebar-container">
          
          {/* Sidebar Brand Header */}
          <div className="p-6 border-b border-slate-900 flex items-center justify-between" id="sidebar-header">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-md">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-sans text-base font-bold text-white tracking-tight">ERP<span className="text-emerald-400">One</span></span>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              id="btn-close-sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Company Quick-Switcher dropdown */}
          <div className="p-4 border-b border-slate-900 relative" id="quick-switcher-container">
            <button
              onClick={() => setIsCompanySelectorOpen(!isCompanySelectorOpen)}
              className="w-full p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left"
              id="btn-company-switcher"
            >
              <div className="flex items-center gap-2 min-w-0">
                {companyData?.company.logo ? (
                  <img src={companyData.company.logo} alt="logo" className="w-6 h-6 object-contain rounded-md bg-white p-0.5" />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0">
                    {companyData?.company.name.charAt(0) || 'C'}
                  </div>
                )}
                <span className="text-xs font-bold text-white truncate pr-1">{companyData?.company.name || 'Select Company'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Switcher Dropdown popover */}
            {isCompanySelectorOpen && (
              <div className="absolute left-4 right-4 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 text-xs py-2" id="switcher-dropdown">
                <div className="max-h-[160px] overflow-y-auto space-y-1 px-1">
                  {companies.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => {
                        setCurrentCompanyId(comp.id);
                        setIsCompanySelectorOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                        currentCompanyId === comp.id 
                          ? 'bg-emerald-500 text-white' 
                          : 'text-slate-350 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {comp.logo ? (
                        <img src={comp.logo} alt="logo" className="w-5 h-5 object-contain rounded bg-white p-0.5" />
                      ) : (
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${
                          currentCompanyId === comp.id ? 'bg-white/20 border-white/30 text-white' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {comp.name.charAt(0)}
                        </div>
                      )}
                      <span className="truncate">{comp.name}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800/80 mt-2 pt-2 px-2">
                  <button
                    onClick={() => {
                      setIsCreatingNewCompany(true);
                      setIsCompanySelectorOpen(false);
                    }}
                    className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    id="btn-add-company-switcher"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Company
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links list */}
          <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1.5" id="sidebar-nav-links">
            {[
              { id: 'Dashboard', title: 'Analytics Dashboard', icon: Layers },
              { id: 'Employees', title: 'Employees Register', icon: Users },
              { id: 'Clients', title: 'Partners & Clients', icon: Building },
              { id: 'Projects', title: 'Project Pipelines', icon: Briefcase },
              { id: 'Tasks', title: 'Operational Tasks', icon: Target },
              { id: 'Finance', title: 'Cashflow Ledger', icon: DollarSign },
              { id: 'Settings', title: 'Company Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as SubView);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    activeView === item.id
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                  id={`nav-link-${item.id}`}
                >
                  <Icon className="w-4 h-4" /> {item.title}
                </button>
              );
            })}
          </div>

          {/* Sidebar bottom Profile Card */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/50 space-y-3" id="sidebar-footer">
            <div className="flex items-center gap-2.5" id="sidebar-user-info">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-350 font-bold text-xs flex items-center justify-center border border-slate-700 shrink-0">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0" id="sidebar-user-meta">
                <span className="text-[10px] font-semibold text-slate-500 block">Logged In User</span>
                <span className="text-xs font-bold text-white truncate block leading-snug">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-red-400 hover:text-red-300 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-850"
              id="btn-sidebar-logout"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area - Right Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto" id="app-content-wrapper">
        
        {/* Top bar header */}
        <header className="sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-250/50 dark:border-slate-800 z-30 px-6 py-4 flex items-center justify-between" id="app-topbar">
          <div className="flex items-center gap-3" id="topbar-left">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              id="btn-open-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> {companyData?.company.category} Workspace
              </span>
              <h1 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-tight">{companyData?.company.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3" id="topbar-right">
            {/* Mobile Simulator Toggle */}
            <button
              onClick={() => setIsSimulatedMobile(true)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/15 cursor-pointer mr-1 animate-pulse"
              id="btn-mobile-sim-toggle"
            >
              📱 Mobile App View
            </button>

            {/* Dark mode switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              id="btn-theme-switch"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </button>

            <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full uppercase tracking-wider block">
              {companyData?.company.country}
            </span>
          </div>
        </header>

        {/* Dynamic active view viewport */}
        <main className="p-6 max-w-7xl w-full mx-auto flex-1 pb-16" id="app-main-viewport">
          {renderActiveView()}
        </main>

      </div>

    </div>
  );
}
