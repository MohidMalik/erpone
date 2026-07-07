// src/components/AuthScreen.tsx
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { Shield, Building2, Layers, Briefcase, ChevronRight } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      // Register user with backend
      const token = await result.user.getIdToken();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error('Failed to register user in backend database.');
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden" id="auth-screen">
      {/* Background Decorative Accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="w-full max-w-5xl bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden grid md:grid-cols-12 shadow-2xl relative z-10" id="auth-container">
        {/* Branding & Marketing Panel */}
        <div className="md:col-span-7 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 md:p-12 flex flex-col justify-between border-r border-slate-800" id="branding-panel">
          <div>
            <div className="flex items-center gap-3 mb-8" id="logo-header">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg" id="logo-icon-bg">
                <Building2 className="w-5 h-5 text-white" id="logo-svg" />
              </div>
              <span className="font-sans text-xl font-bold text-white tracking-tight" id="logo-text">ERP<span className="text-emerald-400">One</span></span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4" id="main-headline">
              One Login.<br />
              <span className="text-gradient bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Unlimited Businesses.</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 max-w-md" id="sub-headline">
              A highly secured, isolated, multi-tenant ERP system designed to help serial entrepreneurs, freelancers, and project managers control all operations from a single workspace.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4" id="feature-list">
              <div className="flex items-start gap-3" id="feat-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0" id="feat-icon-1">
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Strict Multi-Tenant Isolation</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Separate databases, analytics, users, logs, and billing for every company.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3" id="feat-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0" id="feat-icon-2">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Specialized Domain Modules</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Digital Agency, Software House, Clinic, Real Estate, E-Commerce & more.</p>
                </div>
              </div>

              <div className="flex items-start gap-3" id="feat-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0" id="feat-icon-3">
                  <Shield className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Audits, Backup, & Data Security</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Full activity logging, role-based controls, and cryptographic data protection.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 text-xs text-slate-500 border-t border-slate-900/60 flex items-center gap-2" id="workspace-credits">
            <span>Powered by PostgreSQL & Firebase</span>
          </div>
        </div>

        {/* Login Action Panel */}
        <div className="md:col-span-5 p-8 md:p-12 flex flex-col justify-center bg-slate-950" id="action-panel">
          <div className="mb-6" id="action-header">
            <h2 className="text-xl font-bold text-white tracking-tight" id="sign-in-heading">Get Started</h2>
            <p className="text-xs text-slate-400 mt-1" id="sign-in-sub">Sign in with your Google Workspace or personal account to access your companies.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs" id="auth-error">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-950 font-semibold rounded-xl text-sm flex items-center justify-center gap-3 transition-colors shadow-lg shadow-white/5 cursor-pointer disabled:opacity-50"
            id="google-login-btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" id="loading-spinner" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" id="google-logo">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span id="google-btn-text">{loading ? 'Connecting...' : 'Sign In with Google'}</span>
          </button>

          <div className="mt-8 pt-6 border-t border-slate-900 text-center" id="privacy-notice">
            <span className="text-[10px] text-slate-500 block">
              By continuing, you agree to secure account access and data isolation standards. All sessions are audited for compliance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
