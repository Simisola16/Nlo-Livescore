import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Globe2,
  Lock,
  ShieldCheck,
  Upload,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { NLO_OFFICIAL_LOGO_URL } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';

export const RefereeLoginPage: React.FC = () => {
  const { loginWithToken } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
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
      loginWithToken(res.token, res.user, res.referee);
      if (res.user.role === 'SUPER_ADMIN' || res.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/referee');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-10 bg-slate-100">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-nlo-navy text-white p-6 text-center border-b-4 border-emerald-500">
          <img
            src={NLO_OFFICIAL_LOGO_URL}
            alt="NLO Logo"
            className="w-14 h-14 rounded-xl bg-white p-1.5 mx-auto mb-3 object-contain shadow"
          />
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            Official Match Officials Portal
          </span>
          <h1 className="text-2xl font-extrabold mt-2">Referee Sign In</h1>
          <p className="text-xs text-slate-300 mt-1">
            Sign in to access your approved NLO Cup Group/Centre and Live Match Control Centre.
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
              Official Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="referee@nlocup.ng"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {submitting ? 'Authenticating...' : 'Sign In to Referee Portal'}
          </button>

          <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-600">
            <p>
              New NLO Cup Match Official?{' '}
              <Link to="/referee/register" className="font-bold text-emerald-700 hover:underline">
                Register Referee Account
              </Link>
            </p>
            <p>
              NLO Secretariat Administrator?{' '}
              <Link to="/admin/login" className="font-bold text-nlo-navy hover:underline">
                Super Admin Login →
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RefereeRegisterPage: React.FC = () => {
  const { zones, groups, loginWithToken } = useApp();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [refereeIdNumber, setRefereeIdNumber] = useState<string>('');
  const [primaryGroupId, setPrimaryGroupId] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<string>('3');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const selectedGroup = groups.find((g) => g.id === primaryGroupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!primaryGroupId) {
      setError('Please select your official NLO Cup Competition Group / Centre.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('refereeIdNumber', refereeIdNumber.trim().toUpperCase());
      formData.append('primaryGroupId', primaryGroupId);
      formData.append('experienceYears', experienceYears || '1');
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await apiRequest<{
        token: string;
        user: any;
        referee: any;
      }>('/api/auth/register-referee', {
        method: 'POST',
        body: formData,
      });

      loginWithToken(res.token, res.user, res.referee);
      navigate('/referee');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-nlo-navy text-white p-6 sm:p-8 border-b-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={NLO_OFFICIAL_LOGO_URL}
              alt="NLO Logo"
              className="w-12 h-12 rounded-xl bg-white p-1 object-contain"
            />
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                <UserPlus className="w-3.5 h-3.5" />
                NLO Cup Match Officials Accreditation
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-0.5">
                Referee Account Registration
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Register with your official Referee Identification Number and select your assigned NLO
            Cup Group/Centre. All applications enter <strong>PENDING</strong> status until verified
            by the Super Admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Personal & Identification Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name (As on NFA/NLO License) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ibrahim Musa Danjuma"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Referee Identification Number *
              </label>
              <input
                type="text"
                required
                value={refereeIdNumber}
                onChange={(e) => setRefereeIdNumber(e.target.value.toUpperCase())}
                placeholder="e.g. NLO-REF-2026-104"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="referee@example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 000 0000"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Password (Min 8 chars, Upper, Lower, Number) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Strong password (e.g. RefPass!2026)"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Years of Officiating Experience
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
              />
            </div>
          </div>

          {/* Regional Selection: 7 Official Competition Groups/Centres Nested Under 4 Parent Geopolitical Zones */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <Globe2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Official NLO Cup Competition Group / Centre Selection *
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select your official Group/Centre below (nested under its Parent Geopolitical
                  Zone). Once approved, your dashboard will strictly display and unlock matches
                  within your approved Group/Centre.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="ref-group-select" className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Official Group / Centre (7 Official Centres across 4 Geopolitical Zones)
              </label>
              <select
                id="ref-group-select"
                required
                value={primaryGroupId}
                onChange={(e) => setPrimaryGroupId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">-- Choose Your Official NLO Cup Group / Centre --</option>
                {zones.map((zone) => (
                  <optgroup key={zone.id} label={`${zone.name} (${zone.code})`}>
                    {zone.groups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name} ({grp.code}) — Parent Zone: {zone.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {selectedGroup && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs text-emerald-950">
                <div>
                  <span className="font-bold block">
                    Selected Centre: {selectedGroup.name} ({selectedGroup.code})
                  </span>
                  <span className="text-emerald-800">
                    Parent Geopolitical Zone: <strong>{selectedGroup.parentZoneName}</strong> •
                    Format: {selectedGroup.format}
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            )}
          </div>

          {/* Profile Photograph Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Referee Profile Photograph (Optional — JPG/PNG/WebP)
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50 px-4 py-3 cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>
                  {photoFile ? (
                    <strong className="text-slate-900">{photoFile.name}</strong>
                  ) : (
                    'Click to select your official passport/headshot photograph'
                  )}
                </span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {submitting
              ? 'Submitting Official Application...'
              : 'Submit Referee Application (Status: PENDING)'}
          </button>

          <p className="text-center text-xs text-slate-600">
            Already registered?{' '}
            <Link to="/referee/login" className="font-bold text-emerald-700 hover:underline">
              Sign In to Referee Portal
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

