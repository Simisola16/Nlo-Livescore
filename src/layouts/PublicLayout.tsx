import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  Menu,
  Radio,
  ShieldCheck,
  UserCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { NFF_OFFICIAL_CREST_URL, NLO_OFFICIAL_LOGO_URL } from '@nlo-cup/package';
import { useApp } from '../context/AppContext.tsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/live', label: 'Live Scores' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/results', label: 'Results' },
  { to: '/standings', label: 'Standings' },
  { to: '/teams', label: 'Teams' },
  { to: '/regions', label: 'Regions' },
  { to: '/about', label: 'About' },
];

export const PublicLayout: React.FC = () => {
  const {
    user,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    socketConnected,
    liveToast,
    dismissToast,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Broadcast Status & Season Bar */}
      <div className="bg-nlo-navyDark text-slate-200 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              {socketConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>LIVE SYNC ACTIVE (WAT / UTC+1)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">RECONNECTING FEED...</span>
                </>
              )}
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-300">
              Nigeria Nationwide League One (NLO) Official Competition Platform
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="season-select" className="text-slate-400 font-medium">
                Season:
              </label>
              <select
                id="season-select"
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isActive ? '(Active)' : s.isArchived ? '(Archive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {user?.role === 'REFEREE' ? (
                <Link
                  to="/referee/dashboard"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Referee Dashboard
                </Link>
              ) : (
                <Link
                  to="/referee/login"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Referee Portal
                </Link>
              )}

              {user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Super Admin
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Brand Header & Navigation */}
      <header className="bg-nlo-navy text-white sticky top-0 z-40 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={NLO_OFFICIAL_LOGO_URL}
              alt="Nationwide League One (NLO) Logo"
              className="w-11 h-11 rounded-lg bg-white p-0.5 object-contain shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  NLO CUP <span className="text-emerald-400">LIVE</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white rounded">
                  Official
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Nationwide League One Competition &amp; Live Scoring
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                {item.to === '/live' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    {item.label}
                  </span>
                ) : (
                  item.label
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <img
              src={NFF_OFFICIAL_CREST_URL}
              alt="Nigeria Football Association Crest"
              className="hidden sm:block w-10 h-10 rounded-full bg-white p-0.5 object-contain"
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="lg:hidden bg-nlo-navyDark border-t border-slate-800 px-4 py-3 grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Real-Time Live Notification Banner */}
      {liveToast && (
        <div className="bg-emerald-900 text-white border-b border-emerald-700 px-4 py-2.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm">
              <Bell className="w-4 h-4 text-emerald-300 animate-bounce shrink-0" />
              <span className="font-extrabold">{liveToast.title}:</span>
              <span className="text-emerald-100">{liveToast.message}</span>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              className="text-xs font-bold px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Professional Footer */}
      <footer className="bg-nlo-navyDark text-slate-300 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={NLO_OFFICIAL_LOGO_URL}
                alt="NLO Logo"
                className="w-10 h-10 rounded bg-white p-0.5 object-contain"
              />
              <img
                src={NFF_OFFICIAL_CREST_URL}
                alt="NFF Crest"
                className="w-10 h-10 rounded-full bg-white p-0.5 object-contain"
              />
              <span className="font-extrabold text-lg text-white">NLO CUP LIVE</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              The official live score, referee match control, and competition administration
              platform for Nigeria&apos;s Nationwide League One (NLO) Cup across all 4 Geopolitical
              Zones and 7 Official Competition Centres.
            </p>
            <p className="text-xs text-slate-500">
              Default Competition Timezone: Africa/Lagos (West Africa Time, WAT / UTC+01:00).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
              Competition Centres
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Southwest Zone — Group A, Centre B, Centre C, Group D</li>
              <li>North Central Zone (Abuja / Jos / Ajaokuta)</li>
              <li>Northwest Zone (Kano / Zaria / Danbatta)</li>
              <li>South East &amp; South South Zone (Aba / Uyo / Enugu / Umuahia)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
              Platform Portals
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/live" className="hover:text-emerald-400 transition-colors">
                  Live Scoreboard
                </Link>
              </li>
              <li>
                <Link to="/fixtures" className="hover:text-emerald-400 transition-colors">
                  Official Fixtures (252 Matches)
                </Link>
              </li>
              <li>
                <Link to="/referee/register" className="hover:text-emerald-400 transition-colors">
                  Referee Registration Portal
                </Link>
              </li>
              <li>
                <Link to="/referee/login" className="hover:text-emerald-400 transition-colors">
                  Referee Match Control Login
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-emerald-400 transition-colors">
                  Super Admin Command Centre
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Nationwide League One (NLO) Cup Live Platform. All
          official fixtures verified against NLO Secretariat tournament schedules.
        </div>
      </footer>
    </div>
  );
};

