// src/components/SetupWizard.tsx
import React, { useState, useRef } from 'react';
import { Building2, Upload, MapPin, DollarSign, ArrowRight, ArrowLeft, Loader2, Sparkles, Plus } from 'lucide-react';
import { BusinessCategory } from '../types.ts';
import { auth } from '../lib/firebase.ts';

interface SetupWizardProps {
  onCompanyCreated: (company: any) => void;
  onCancel?: () => void;
}

const CATEGORIES: { name: BusinessCategory; desc: string; icon: string }[] = [
  { name: 'Digital Agency', desc: 'Clients, projects, contracts, tracking, invoices', icon: '⚡' },
  { name: 'Software House', desc: 'Projects, tasks, devs, bugs tracker, products', icon: '💻' },
  { name: 'Ecommerce Store', desc: 'Products, inventory, order lists, suppliers', icon: '🛒' },
  { name: 'Medical Clinic', desc: 'Patients, appointments, doctors, records', icon: '🏥' },
  { name: 'Construction Company', desc: 'Projects, contractors, material costs, workers', icon: '🏗️' },
  { name: 'Real Estate', desc: 'Properties, buyers, sellers, agent listings', icon: '🏠' },
  { name: 'Freelancer', desc: 'Single-operator clients, contracts, payments', icon: '🧑‍💻' },
  { name: 'Custom Business', desc: 'Define your own workflows and custom entities', icon: '⚙️' },
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'PKR', name: 'Pakistani Rupee (Rs)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SAR', name: 'Saudi Riyal (SR)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
];

const COUNTRIES = [
  "United States", "United Kingdom", "Pakistan", "India", "United Arab Emirates", 
  "Saudi Arabia", "Canada", "Australia", "Germany", "France", "Singapore"
];

export default function SetupWizard({ onCompanyCreated, onCancel }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [category, setCategory] = useState<BusinessCategory>('Digital Agency');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [taxInfo, setTaxInfo] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('United States');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Logo file handling
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file for the logo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoFile(e.target.files[0]);
    }
  };

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Company Name is required.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          logo,
          category,
          phone,
          email,
          address,
          website,
          taxInfo,
          currency,
          country
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create company');
      }

      const company = await res.json();
      onCompanyCreated(company);
    } catch (err: any) {
      setError(err.message || 'An error occurred while setting up your company.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 transition-colors duration-300" id="setup-wizard-root">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden relative" id="wizard-card">
        
        {/* Decorative ambient background for setup */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-blue-600" />

        {/* Header / Progress bar */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50" id="wizard-header">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block mb-1">Company Setup Wizard</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" /> Configure New Account
            </h2>
          </div>
          <div className="flex items-center gap-1.5" id="step-indicators">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-2 rounded-full transition-all duration-300 ${
                  s === step 
                    ? 'w-10 bg-emerald-500' 
                    : s < step 
                      ? 'bg-emerald-600 dark:bg-emerald-700' 
                      : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 md:mx-8 mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-2xl text-xs flex items-center gap-2" id="setup-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 md:p-8" id="setup-form">
          {/* STEP 1: Basic Identity & Category */}
          {step === 1 && (
            <div className="space-y-6" id="wizard-step-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Company Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Antigravity Labs Ltd."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Category Select Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Business Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1" id="category-grid">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`p-3.5 text-left border rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
                        category === cat.name
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/10 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="text-2xl mt-0.5 shrink-0">{cat.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{cat.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Branding & File Upload */}
          {step === 2 && (
            <div className="space-y-6" id="wizard-step-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Company Logo</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
                      : logo 
                        ? 'border-emerald-500 bg-slate-50 dark:bg-slate-950/20' 
                        : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                  id="logo-dropzone"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {logo ? (
                    <div className="flex flex-col items-center gap-3" id="logo-preview-container">
                      <img src={logo} alt="Company Logo Preview" className="h-20 w-20 object-contain rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-white" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Click or drag another image to replace</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2" id="logo-placeholder">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                        <Upload className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Drag & Drop Logo here</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">or click to browse from files</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="contacts-grid">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Company Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Company Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.company.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Financials & Location */}
          {step === 3 && (
            <div className="space-y-6" id="wizard-step-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="financials-grid">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Currency</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                    >
                      {CURRENCIES.map((cur) => (
                        <option key={cur.code} value={cur.code}>{cur.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Country</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                    >
                      {COUNTRIES.map((cnt) => (
                        <option key={cnt} value={cnt}>{cnt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Tax Registration ID (Tax Info)</label>
                <input
                  type="text"
                  value={taxInfo}
                  onChange={(e) => setTaxInfo(e.target.value)}
                  placeholder="e.g. VAT-982428 or EIN-12-345678"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Company Physical Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street 10, Industrial Sector, NY, USA"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" id="wizard-footer">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                id="wizard-back-btn"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                id="wizard-cancel-btn"
              >
                Cancel
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
                id="wizard-next-btn"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
                id="wizard-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Finalizing Setup...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create Company Account
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
