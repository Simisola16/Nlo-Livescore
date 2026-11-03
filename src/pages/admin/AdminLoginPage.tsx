import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { NFF_OFFICIAL_CREST_URL, NLO_OFFICIAL_LOGO_URL } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';

export const AdminLoginPage: React.FC = () => {
  const { loginWithToken } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('admin@nlocup.ng');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        token: string;
        user: any;
        referee: any;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.user.role !== 'SUPER_ADMIN' && res.user.role !== 'ADMIN') {
        setError('Access denied: This login portal is restricted to NLO Super Administrators.');
        setSubmitting(false);
        return;
      }

      loginWithToken(res.token, res.user, res.referee);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-10 bg-slate-900">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-nlo-navy text-white p-6 text-center border-b-4 border-emerald-500">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src={NLO_OFFICIAL_LOGO_URL}
              alt="NLO Logo"
              className="w-12 h-12 rounded-xl bg-white p-1 object-contain"
            />
            <img
              src={NFF_OFFICIAL_CREST_URL}
              alt="NFF Crest"
              className="w-12 h-12 rounded-full bg-white p-1 object-contain"
            />
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            NLO Secretariat Command Centre
          </span>
          <h1 className="text-2xl font-extrabold mt-2">Super Admin Sign In</h1>
          <p className="text-xs text-slate-300 mt-1">
            Restricted to authorized Nationwide League One Competition Administrators.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrator Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Super Admin password"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-nlo-navy hover:bg-slate-800 text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            {submitting ? 'Verifying Credentials...' : 'Enter Super Admin Dashboard'}
          </button>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Are you a Match Referee?{' '}
            <Link to="/referee/login" className="font-bold text-emerald-700 hover:underline">
              Go to Referee Portal →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

